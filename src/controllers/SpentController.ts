import { Request, Response } from "express";
import query from "../database/connection";

class SpentController {
  public async create(req: Request, res: Response): Promise<void> {
    const { idproduct, value } = req.body;
    const { id:iduser } = res.locals;
    const r:any = await query(
      "INSERT INTO spents(iduser,idproduct,value) VALUES ($1,$2,$3) RETURNING id,idproduct as product,datetime,value",
      [iduser, idproduct, value]
    );
    res.json(r);
  }

  public async list(req: Request, res: Response): Promise<void> {
    const { id: iduser } = res.locals;
    const page = parseInt(req.params.page || '1', 10);
    const itemsPerPage = 5;
    let offset = (page - 1) * itemsPerPage;

    const totalData = await query(
      "SELECT COUNT(*) as count, SUM(a.value::FLOAT) as total FROM spents AS a WHERE iduser = $1",
      [iduser]
    );

    const totalItems = parseInt(totalData[0].count, 10) || 0;
    const totalSumValue = parseFloat(totalData[0].total) || 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const currentPage = page > totalPages ? totalPages : page;
    offset = (currentPage - 1) * itemsPerPage;
    if (totalItems === 0) {
      res.json({
        spents: [],
        page: currentPage,
        pages: totalPages,
        count: totalItems,
        average: 0,
      });
      return;
    }
    const spents = await query(
      "SELECT a.id, b.name, a.value::FLOAT, a.datetime FROM spents AS a LEFT JOIN products AS b ON a.idproduct = b.id WHERE a.iduser = $1 ORDER BY a.datetime DESC LIMIT $2 OFFSET $3",
      [iduser, itemsPerPage, offset]
    );

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
    const { id:iduser } = res.locals;

    const r:any = await query(
      "DELETE FROM spents WHERE id = $1 AND iduser=$2 RETURNING id,idproduct as product,value,datetime", 
      [id, iduser]
    );
    if( r.rowcount > 0 ){
      res.json(r.rows);
    }
    else{
      res.json({ message: "Registro inexistente" });
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    const { id, product, value } = req.body;
    const { id:iduser } = res.locals;
    const r:any = await query(
      "UPDATE spents SET idproduct=$3, value=$4 WHERE id=$1 AND iduser=$2 RETURNING id,idproduct as product,value,datetime", 
      [id,iduser,product,value]
    );

    if( r.rowcount > 0 ){
      res.json(r.rows);
    }
    else if ( r.rowcount === 0 ){
      res.json({ message: "Registro inexistente" });
    }
    else{
      res.json({ message: r.message });
    }
  }
}

export default new SpentController();
