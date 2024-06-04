import { Router, Request, Response } from "express";
import controller from "../controllers/SpentController";
import { validadeAcess } from "../middlewares";

const routes = Router();

routes.get ("/produtos",validadeAcess,controller.statsByProduct);
routes.get ("/usuarios",validadeAcess,controller.statsByUser)
routes.get("/listar/:page", controller.list);
routes.get("/listar", controller.list);
routes.post("/", controller.create);
routes.delete("/", controller.delete);
routes.put("/", controller.update);

//aceita qualquer método HTTP ou URL
routes.use( (_:Request,res:Response) => res.json({error:"Operação desconhecida com o gasto"}) );

export default routes;