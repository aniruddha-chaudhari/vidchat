import { Router } from "express";
import { sendMessages,getMessages } from "../controller/messageContoller";
import protectRoute from "../middleware/ProtectRoute";

const router = Router();

router.post('/send/:chatId', protectRoute, sendMessages);
router.get('/get/:chatId', protectRoute, getMessages);

export default router;