-- ### a) 区間重複禁止・チェック制約
-- btree_gist拡張を有効化。EXCLUDE制約で必要となるGiSTインデックスを利用可能にする。
CREATE EXTENSION IF NOT EXISTS btree_gist;
-- attendance_logテーブルのended_atがNULLまたはstarted_at < ended_atであることを保証するチェック制約。
-- これにより、開始時刻が終了時刻より後になる不正なデータを防ぐ。
ALTER TABLE attendance_log
ADD CONSTRAINT chk_att_time CHECK (
        ended_at IS NULL
        OR started_at < ended_at
    );
-- attendance_logテーブルで、同一user_idについて勤務区間（started_at～ended_at）が重複しないことを保証する排他制約。
-- tstzrangeで時刻範囲を作り、&&で範囲の重複を禁止する。
ALTER TABLE attendance_log
ADD CONSTRAINT attendance_no_overlap EXCLUDE USING gist (
        user_id WITH =,
        tstzrange(started_at, COALESCE(ended_at, 'infinity')) WITH &&
    );
-- ### b) 期間の妥当性・給与itemのチェック
-- payroll_periodテーブルで、開始日が終了日より後にならないことを保証するチェック制約。
ALTER TABLE payroll_period
ADD CONSTRAINT chk_period_range CHECK (start_date <= end_date);
-- payroll_itemテーブルで、worked_minutes（勤務分数）が0以上であることを保証するチェック制約。
ALTER TABLE payroll_item
ADD CONSTRAINT chk_worked_minutes_nonneg CHECK (worked_minutes >= 0);
-- user_compensation（レート履歴）テーブルで、同一user_idの期間が重複しないことを保証する排他制約。
-- 期間重複禁止のため、tstzrangeで有効期間を範囲化し、&&で重複を禁止する。
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE user_compensation
ADD CONSTRAINT no_overlap_rate EXCLUDE USING gist (
        user_id WITH =,
        tstzrange(
            effective_from,
            COALESCE(effective_to, 'infinity')
        ) WITH &&
    );
-- ### c) `updated_at` 自動更新トリガ
-- レコード更新時に自動でupdated_atカラムを現在時刻に更新するトリガ関数を作成。
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at := now();
RETURN NEW;
END $$;
-- 各テーブルのUPDATE時にset_updated_at関数を呼び出すトリガを作成。
-- これにより、レコード更新時にupdated_atが自動で更新される。
CREATE TRIGGER trg_user_updated BEFORE
UPDATE ON "user" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_card_updated BEFORE
UPDATE ON card FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_card_assignment_updated BEFORE
UPDATE ON card_assignment FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_attendance_log_updated BEFORE
UPDATE ON attendance_log FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_attendance_status_updated BEFORE
UPDATE ON attendance_status FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_attendance_log_source_updated BEFORE
UPDATE ON attendance_log_source FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_work_log_updated BEFORE
UPDATE ON work_log FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_project_updated BEFORE
UPDATE ON project FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_compensation_updated BEFORE
UPDATE ON user_compensation FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payroll_period_updated BEFORE
UPDATE ON payroll_period FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payroll_item_updated BEFORE
UPDATE ON payroll_item FOR EACH ROW EXECUTE FUNCTION set_updated_at();
-- ### d) “現役カード”の導出ビュー（current_card_id の代替）
-- 現在割り当て中（unassigned_atがNULL）のカードをユーザーごとに取得するビューを作成。
CREATE OR REPLACE VIEW v_current_card_assignment AS
SELECT user_id,
    card_id
FROM card_assignment
WHERE unassigned_at IS NULL;
-- 3) シード（固定テーブル）
-- attendance_statusとattendance_log_sourceはenumの代替として固定行を持つテーブル。
-- ここで初期データを挿入。ON CONFLICT (id) DO NOTHINGで重複時は挿入しない。
INSERT INTO attendance_status (id, code, label, is_active, sort_no)
VALUES (1, 'OFF', '勤務外', true, 1),
    (2, 'WORKING', '勤務中', true, 2),
    (3, 'BREAK', '休憩中', true, 3) ON CONFLICT (id) DO NOTHING;
INSERT INTO attendance_log_source (id, code, label, is_active, sort_no)
VALUES (1, 'ADMIN', 'ADMIN', true, 1),
    (2, 'WEB', 'WEB', true, 2),
    (3, 'DISCORD', 'DISCORD', true, 3),
    (4, 'NFC1', 'NFC1', true, 4)
    ON CONFLICT (id) DO NOTHING;
