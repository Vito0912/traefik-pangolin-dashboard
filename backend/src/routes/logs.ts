import { Router } from 'express';
import db from '../db/db.js';

const router = Router();

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 100;
  const offset = (page - 1) * limit;

  ///
  /// Sort
  ///

  const availableSortOptions = [
    'ClientHost',
    'DownstreamContentSize',
    'DownstreamStatus',
    'Duration',
    'id',
    'RequestMethod',
    'RequestPath',
    'request_User-Agent',
    'request_X-Forwarded-Proto',
    'RetryAttempts',
    'ServiceName',
    'StartUTC',
    'time'
  ];

  const sortByParam = (req.query.sortBy as string) || 'time';
  const sortFields = sortByParam.split(',').map((s) => s.trim());

  for (const field of sortFields) {
    if (!availableSortOptions.includes(field)) {
      return res.status(400).json({
        error: `Invalid sortBy field "${field}". Available options: ${availableSortOptions.join(', ')}`
      });
    }
  }

  const directionParam = (req.query.direction as string) || 'desc';
  const directions = directionParam.split(',').map((d) => d.trim().toLowerCase());

  for (const dir of directions) {
    if (dir !== 'asc' && dir !== 'desc') {
      return res.status(400).json({
        error: `Invalid direction "${dir}". Available options: asc, desc`
      });
    }
  }

  while (directions.length < sortFields.length) {
    directions.push(directions[directions.length - 1]);
  }

  ///
  /// Query
  ///

  let query = db.selectFrom('logs').selectAll();
  sortFields.forEach((field, i) => {
    query = query.orderBy(field, directions[i] as 'asc' | 'desc');
  });
  query = query.orderBy('time', 'desc').limit(limit).offset(offset);

  ///
  /// Filter
  ///

  const availableFilterOptions = [
    'ClientHost',
    'RequestMethod',
    'RequestPath',
    'DownstreamStatus',
    'ServiceName',
    'requestUser-Agent'
  ];

  let totalQuery = db.selectFrom('logs');

  for (const key in req.query) {
    if (availableFilterOptions.includes(key)) {
      const values = req.query[key];

      if (typeof values === 'string') {
        const valueArray = values.split(',');
        const hasNullValue = valueArray.includes('null');
        const nonNullValues = valueArray.filter((v) => v !== 'null');

        query = query.where((eb) => {
          const conditions = [];

          if (hasNullValue) {
            conditions.push(eb(key, 'is', null));
          }

          if (nonNullValues.length > 0) {
            conditions.push(eb(key, 'in', nonNullValues));
          }

          return eb.or(conditions);
        });

        totalQuery = totalQuery.where((eb) => {
          const conditions = [];

          if (hasNullValue) {
            conditions.push(eb(key, 'is', null));
          }

          if (nonNullValues.length > 0) {
            conditions.push(eb(key, 'in', nonNullValues));
          }

          return eb.or(conditions);
        });
      }
    }

    if (key.startsWith('not_') && availableFilterOptions.includes(key.substring(4))) {
      const filterKey = key.substring(4);
      const value = req.query[key];

      if (typeof value === 'string') {
        const valueArray = value.split(',');
        const hasNullValue = valueArray.includes('null');
        const nonNullValues = valueArray.filter((v) => v !== 'null');

        query = query.where((eb) => {
          const conditions = [];

          if (hasNullValue && nonNullValues.length > 0) {
            conditions.push(eb.and([eb(filterKey, 'is not', null), eb(filterKey, 'not in', nonNullValues)]));
          } else if (hasNullValue) {
            conditions.push(eb(filterKey, 'is not', null));
          } else {
            conditions.push(eb.or([eb(filterKey, 'is', null), eb(filterKey, 'not in', nonNullValues)]));
          }

          return conditions[0];
        });

        totalQuery = totalQuery.where((eb) => {
          const conditions = [];

          if (hasNullValue && nonNullValues.length > 0) {
            conditions.push(eb.and([eb(filterKey, 'is not', null), eb(filterKey, 'not in', nonNullValues)]));
          } else if (hasNullValue) {
            conditions.push(eb(filterKey, 'is not', null));
          } else {
            conditions.push(eb.or([eb(filterKey, 'is', null), eb(filterKey, 'not in', nonNullValues)]));
          }

          return conditions[0];
        });
      }
    }
  }

  const logs = await query.execute();

  const total = await totalQuery.select(db.fn.count('id').as('count')).executeTakeFirst();

  const ips = await db.selectFrom('logs').select('ClientHost').distinct().execute();
  console.log(ips.length);

  res.json({
    logs,
    pagination: {
      page,
      limit,
      total: Number(total?.count || 0),
      pages: Math.ceil(Number(total?.count || 0) / limit)
    }
  });
});

router.get('/stats', async (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  if (isNaN(limit) || limit <= 0 || limit > 100) {
    return res.status(400).json({ error: 'Invalid limit parameter. Must be a number between 1 and 100.' });
  }

  const totalRequests = await db.selectFrom('logs').select(db.fn.count('id').as('count')).executeTakeFirst();
  const totalBytes = await db
    .selectFrom('logs')
    .select(db.fn.sum('DownstreamContentSize').as('sum'))
    .executeTakeFirst();
  const requestsByStatus = await db
    .selectFrom('logs')
    .select(['DownstreamStatus', db.fn.count('id').as('count')])
    .groupBy('DownstreamStatus')
    .execute();
  const requestsByMethod = await db
    .selectFrom('logs')
    .select(['RequestMethod', db.fn.count('id').as('count')])
    .groupBy('RequestMethod')
    .execute();
  const requestsByService = await db
    .selectFrom('logs')
    .select(['ServiceName', db.fn.count('id').as('count')])
    .groupBy('ServiceName')
    .execute();
  const requestsByClients = await db
    .selectFrom('logs')
    .select(['ClientHost', db.fn.count('id').as('count')])
    .groupBy('ClientHost')
    .orderBy('count', 'desc')
    .limit(limit)
    .execute();
  const requestsByPaths = await db
    .selectFrom('logs')
    .select(['RequestPath', db.fn.count('id').as('count')])
    .groupBy('RequestPath')
    .orderBy('count', 'desc')
    .limit(limit)
    .execute();
  const requestsByUserAgent = await db
    .selectFrom('logs')
    .select(['Request_User-Agent', db.fn.count('id').as('count')])
    .groupBy('Request_User-Agent')
    .orderBy('count', 'desc')
    .limit(limit)
    .execute();
  const averageResponseTime = await db
    .selectFrom('logs')
    .select(db.fn.avg('Duration').as('avg'))
    .where('request_X-Forwarded-Proto', '!=', 'wss')
    .executeTakeFirst();

  res.json({
    totalRequests: totalRequests?.count || 0,
    totalBytes: totalBytes?.sum || 0,
    averageResponseTime: averageResponseTime?.avg || 0,
    requestsByStatus,
    requestsByService,
    requestsByClients,
    requestsByPaths,
    requestsByUserAgent,
    requestsByMethod
  });
});

export default router;
