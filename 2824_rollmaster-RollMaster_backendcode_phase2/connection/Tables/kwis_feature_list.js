const create_kwis_feature_list_table = `CREATE TABLE IF NOT EXISTS kwis_feature_list (
    feature_id INT(11) AUTO_INCREMENT,
    module_id INT(11) NOT NULL,
    feature_name varchar(255) NOT NULL ,
    PRIMARY KEY (feature_id)
) `

const create_kwis_feature_list_sync_log_table = `CREATE TABLE IF NOT EXISTS kwis_feature_list_sync_log (
    id INT AUTO_INCREMENT NOT NULL,
    feature_list_id INT NOT NULL COMMENT 'kwis_feature_list(id)',
    operation_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    sync_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('PENDING', 'SUCCESS', 'FAILURE') NOT NULL,
    error_message VARCHAR(500),
    PRIMARY KEY (id)
);`;

const create_insert_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_feature_list_insert
    AFTER INSERT ON kwis_feature_list
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_feature_list_sync_log (feature_list_id, operation_type, status)
        VALUES (NEW.feature_id, 'INSERT', 'PENDING');
    END;`;

const create_update_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_feature_list_update
    AFTER UPDATE ON kwis_feature_list
    FOR EACH ROW
    BEGIN
        INSERT INTO kwis_feature_list_sync_log (feature_list_id, operation_type, status)
        VALUES (NEW.feature_id, 'UPDATE', 'PENDING');
    END;`;

// const create_delete_trigger = `CREATE TRIGGER IF NOT EXISTS trg_kwis_feature_list_sync_log_delete
//     AFTER DELETE ON kwis_feature_list_sync_log
//     FOR EACH ROW
//     BEGIN
//          DELETE FROM kwis_feature_list WHERE id = OLD.feature_list_id;
//     END;`;

module.exports = {
    create_kwis_feature_list_table,
    create_kwis_feature_list_sync_log_table,
    create_insert_trigger,
    create_update_trigger,
    // create_delete_trigger,
};