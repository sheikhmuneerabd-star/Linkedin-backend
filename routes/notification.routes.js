import { Router } from 'express';
import isAuth from '../meddlewares/isAuth.js';
import { clearAllNotifications, deleteNotifications, getNotifications } from '../controllers/notification.controller.js';

let notificationRouter = Router();

notificationRouter.get("/get", isAuth, getNotifications)
notificationRouter.delete("/deleteOne/:id", isAuth, deleteNotifications)
notificationRouter.delete("/", isAuth, clearAllNotifications)

export default notificationRouter