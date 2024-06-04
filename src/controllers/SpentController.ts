import { Request, Response } from "express";
import query from "../database/connection";

class SpentController {
  public async create(req: Request, res: Response): Promise<void> {
    const { idproduct, value } = req.body;
    const { id: iduser } = res.locals;
    const r: any = await query(
      "INSERT INTO spents(iduser,idproduct,value) VALUES ($1,$2,$3) RETURNING id,idproduct as product,datetime,value",
      [iduser, idproduct, value]
    );
    res.json(r);
  }

  public async list(req: Request, res: Response): Promise<void> {
    const { id: iduser } = res.locals;
    const page = parseInt(req.params.page || '1', 10);
    const itemsPerPage = 5;

    let queryStr;
    let queryParams;

    if (!isNaN(page)) {
        const offset = (page - 1) * itemsPerPage;
        queryStr = "SELECT a.id, b.name, a.value::FLOAT, a.datetime FROM spents AS a LEFT JOIN products AS b ON a.idproduct = b.id WHERE a.iduser = $1 ORDER BY a.datetime DESC LIMIT $2 OFFSET $3";
        queryParams = [iduser, itemsPerPage, offset];
    } else {
        queryStr = "SELECT a.id, b.name, a.value::FLOAT, a.datetime FROM spents AS a LEFT JOIN products AS b ON a.idproduct = b.id WHERE a.iduser = $1 ORDER BY a.datetime DESC";
        queryParams = [iduser];
    }

    const totalData = await query(
        "SELECT COUNT(*) as count, SUM(a.value::FLOAT) as total FROM spents AS a WHERE iduser = $1",
        [iduser]
    );

    const totalItems = parseInt(totalData[0].count, 10) || 0;
    const totalSumValue = parseFloat(totalData[0].total) || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    let currentPage = page;

    if (currentPage > totalPages) {
        currentPage = totalPages;
        const offset = (currentPage - 1) * itemsPerPage;
        queryParams = [iduser, itemsPerPage, offset];
    }

    const spents = await query(queryStr, queryParams);

    const average = totalSumValue / totalItems;

    res.json({
        spents,
        page: currentPage,
        pages: totalPages,
        count: totalItems,
        average,
    });
}


  public async delete(req: Request, res: Response): Promise<void> {
    const { id } = req.body;
    const { id: iduser } = res.locals;

    const r: any = await query(
      "DELETE FROM spents WHERE id = $1 AND iduser=$2 RETURNING id,idproduct as product,value,datetime",
      [id, iduser]
    );
    if (r.rowcount > 0) {
      res.json(r.rows);
    } else {
      res.json({ message: "Registro inexistente" });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id, product, value } = req.body;
    const { id: iduser } = res.locals;
    const r: any = await query(
      "UPDATE spents SET idproduct=$3, value=$4 WHERE id=$1 AND iduser=$2 RETURNING id,idproduct as product,value,datetime",
      [id, iduser, product, value]
    );

    if (r.rowcount > 0) {
      res.json(r.rows);
    } else if (r.rowcount === 0) {
      res.json({ message: "Registro inexistente" });
    } else {
      res.json({ message: r.message });
    }
  }

  public async statsByProduct(req: Request, res: Response): Promise<void> {
    const r: any =
      await query(`SELECT a.name,ROUND(AVG(b.value), 2)::FLOAT,COUNT(a.name)::FLOAT,MAX(b.value)::FLOAT,MIN(b.value)::FLOAT
      FROM products as a RIGHT JOIN spents as b ON a.id = b.idproduct 
      GROUP BY a.name ORDER BY a.name ASC;
    `);
    res.json(r);
  }
  public async statsByUser(req: Request, res: Response): Promise<void> {

    const r: any = await query(`SELECT a.mail, SUM(b.value)::FLOAT,COUNT (b.value)::FLOAT
    FROM users as a RIGHT JOIN spents as b ON a.id = b.iduser GROUP BY a.mail ORDER BY a.mail ASC;`);
    res.json(r);
  }
}

export default new SpentController();
