-- user_roleテーブルのUPDATE時にupdated_atを自動更新するトリガ。
-- set_updated_at関数は0001_set.sqlで定義済み。
CREATE TRIGGER trg_user_role_updated BEFORE
UPDATE ON user_role FOR EACH ROW EXECUTE FUNCTION set_updated_at();
