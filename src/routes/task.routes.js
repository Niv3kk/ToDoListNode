import { Router } from 'express';

import {
    store,
    index,
    updateTask,
    deleteTask,
} from '../controllers/task.controller.js';


const router = Router();


router.post('/', store);

router.get('/', index);

router.put('/:id', updateTask);

router.delete('/:id', deleteTask);


export default router;