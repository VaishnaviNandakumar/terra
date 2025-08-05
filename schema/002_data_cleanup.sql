DROP EVENT IF EXISTS delete_old_records;
CREATE EVENT delete_old_records
ON SCHEDULE EVERY 10 MINUTE
DO
  DELETE FROM transactions WHERE created_ts < NOW() - INTERVAL 1 HOUR;
  DELETE FROM product_tags WHERE created_ts < NOW() - INTERVAL 1 HOUR;