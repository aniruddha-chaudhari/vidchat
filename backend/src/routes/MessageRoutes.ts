import { Router } from "express";
import { sendMessages,getMessages } from "../controller/messageContoller";
import protectRoute from "../middleware/ProtectRoute";

const router = Router();

router.post('/send', protectRoute, sendMessages);
router.get('/get', protectRoute, getMessages);

export default router;