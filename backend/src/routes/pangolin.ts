import { Router } from 'express';
import { pangolinService } from '../services/pangolinService';

const router = Router();

router.get('/', async (req, res) => {
  res.json(pangolinService.getPangolinServiceData());
});

export default router;
