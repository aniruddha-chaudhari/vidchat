import { Router } from "express";
import { signup,login,authCheck,logout } from "../controller/authController";
import protectRoute from "../middleware/ProtectRoute";

const router = Router();

router.get('/authcheck',protectRoute, authCheck);
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

export default router;