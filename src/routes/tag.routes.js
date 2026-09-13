import { Router } from 'express';

import {
    createTag,
    getTags,
    updateTag,
    deleteTag,
} from '../controllers/tag.controller.js';


const router = Router();


router.post('/', createTag);

router.get('/', getTags);

router.put('/:id', updateTag);

router.delete('/:id', deleteTag);


export default router;