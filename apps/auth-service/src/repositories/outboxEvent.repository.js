const { pool } = require('../config/db');

/**
 * Transactional outbox writer. Always call `create` with the SAME db
 * client used for the surrounding domain write, inside one transaction,
 * so the event is only durable if the domain change committed too.
 * A separate publisher worker (not part of this HTTP service) polls
 * unpublished rows and pushes them to Kafka once the event backbone
 * is introduced.
 */
const OutboxEventRepository = {
  async create(client, { aggregateType, aggregateId, eventType, payload }) {
    const executor = client || pool;
    const { rows } = await executor.query(
      `INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [aggregateType, aggregateId, eventType, JSON.stringify(payload)]
    );
    return rows[0];
  },
};

module.exports = OutboxEventRepository;