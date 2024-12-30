import { Router } from "express";
import { startIndividualChat } from "../controller/chatContoller";
import protectRoute from "../middleware/ProtectRoute";

const router = Router();

router.post('/individualchat', protectRoute, startIndividualChat);
// router.post('/create', protectRoute, createContact);

export default router;