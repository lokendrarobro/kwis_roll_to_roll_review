const create_kwis_defects_log_table = `CREATE TABLE IF NOT EXISTS kwis_defects_log (
  defect_id BIGINT(20) NOT NULL,
  robro_roll_id BIGINT(20) NOT NULL,
  group_id INT NULL,
  cam_id INT NULL,
  defect_top_left_x_mm FLOAT NOT NULL,
  defect_top_left_y_mm FLOAT NOT NULL,
  defect_width_mm FLOAT NOT NULL,
  defect_height_mm FLOAT NOT NULL,
  defect_type VARCHAR(255) NOT NULL,
  confidence FLOAT NOT NULL,
  cropped_image_path VARCHAR(255) NOT NULL,
  full_image_path VARCHAR(255) NULL,
  defect_top_left_x_px INT NULL,
  defect_top_left_y_px INT NULL,
  defect_height_px INT NULL,
  defect_width_px INT NULL,
  is_enabled TINYINT DEFAULT NULL,
  body_id BIGINT(20) NULL,
  operator_action TINYINT(1) NULL, 
  stopping_command_issued INT NULL DEFAULT NULL,
  splice_id INT DEFAULT NULL,
  updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  merge_id BIGINT(20) COMMENT 'Implement business logic;',
  delete_status TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = not deleted, 1 = deleted',
  merge_status TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = not merged, 1 = merged, 2 = defect merge (merged defects)',
  suggest_for_deletion INT NOT NULL DEFAULT 0 COMMENT '0 = no, 1 = suggested for deletion',
  suggest_for_rejection INT NOT NULL DEFAULT 0 COMMENT '0 = no, 1 = suggested for rejection',
  repair_status TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = not repaired, 1 = repaired',
  model_id INT COMMENT 'kwis_model_info(id)',
  ai_suggestion VARCHAR(255) NULL,
  user_suggestion VARCHAR(255) NULL,
  is_score INT DEFAULT NULL,
  current_sensitivity_x INT DEFAULT NULL,
  required_sensitivity_x INT DEFAULT NULL,
  current_sensitivity_y INT DEFAULT NULL,
  required_sensitivity_y INT DEFAULT NULL,
  PRIMARY KEY (robro_roll_id, defect_id),
  INDEX idx_robro_roll_id (robro_roll_id),
  INDEX idx_roll_delete_status (robro_roll_id, delete_status)
);`;

// const create_kwis_defect_id_trigger = `
// CREATE TRIGGER IF NOT EXISTS set_defect_id_before_insert
// BEFORE INSERT ON kwis_defects_log
// FOR EACH ROW
// BEGIN
//   DECLARE next_defect_id INT;
//   SELECT IFNULL(MAX(defect_id), 0) + 1
//   INTO next_defect_id
//   FROM kwis_defects_log
//   WHERE robro_roll_id = NEW.robro_roll_id;
//   SET NEW.defect_id = next_defect_id;
// END;
// `;


const create_kwis_defects_log_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_defects_log_sync_log (
    id INT AUTO_INCREMENT NOT NULL PRIMARY KEY,
    defect_id BIGINT(20) NOT NULL COMMENT 'kwis_defects_log(defect_id)',
    robro_roll_id BIGINT(20) NOT NULL COMMENT 'kwis_defects_log(robro_roll_id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    UNIQUE INDEX unique_defect_id (defect_id, robro_roll_id, operation_type)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_defects_log_insert
    AFTER INSERT ON kwis_defects_log
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_defects_log_sync_log (defect_id, robro_roll_id, operation_type, status)
        VALUES (NEW.defect_id, NEW.robro_roll_id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_defects_log_update
    AFTER UPDATE ON kwis_defects_log
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_defects_log_sync_log (defect_id, robro_roll_id, operation_type, status)
        VALUES (NEW.defect_id, NEW.robro_roll_id, 'UPDATE', 'PENDING')
        ON DUPLICATE KEY UPDATE status = 'PENDING';
    END;`;

const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_defects_log_sync_log_delete
    AFTER DELETE ON kwis_defects_log_sync_log
    FOR EACH ROW
    BEGIN
         DELETE FROM kwis_defects_log WHERE defect_id = OLD.defect_id AND robro_roll_id = OLD.robro_roll_id;
    END;`;


module.exports = {
  create_kwis_defects_log_table,
  // create_kwis_defect_id_trigger,
  create_kwis_defects_log_sync_log_table,
  create_insert_trigger,
  create_update_trigger,
  create_delete_trigger,
};
