import csv
from datetime import datetime, timedelta
import random
import uuid


def get_jst_month(utc_dt: datetime) -> int:
    """UTCのdatetimeをJSTに変換して月を取得"""
    jst_dt = utc_dt + timedelta(hours=9)
    return jst_dt.month


def get_month_end_utc(utc_dt: datetime) -> datetime:
    """
    指定されたUTC時刻の月末をUTCで返す
    JST換算での月末 = UTC時刻で XX:14:59:59.999
    """
    jst_dt = utc_dt + timedelta(hours=9)
    # JSTでの当月最終日を取得
    if jst_dt.month == 12:
        next_month = jst_dt.replace(year=jst_dt.year + 1, month=1, day=1)
    else:
        next_month = jst_dt.replace(month=jst_dt.month + 1, day=1)

    last_day_jst = next_month - timedelta(days=1)
    # JSTの23:59:59.999 = UTCの14:59:59.999
    last_moment_jst = last_day_jst.replace(hour=23, minute=59, second=59, microsecond=999000)
    last_moment_utc = last_moment_jst - timedelta(hours=9)

    return last_moment_utc


def get_month_start_utc(year: int, month: int) -> datetime:
    """
    指定された年月の月初をUTCで返す
    JST換算での月初 = UTC時刻で XX:15:00:00
    """
    jst_dt = datetime(year, month, 1, 0, 0, 0)
    utc_dt = jst_dt - timedelta(hours=9)
    return utc_dt


def generate_test_csv(output_file: str = "data.csv", start_date: datetime = None, end_date: datetime = None):
    """
    テスト用のCSVファイルを生成する

    Args:
        output_file: 出力ファイル名
        start_date: 開始時刻（UTC）
        end_date: 終了時刻（UTC）
    """
    # 固定のuser_id
    user_id = "19d544de-3046-40bb-8cd4-8b311f665210"

    # デフォルトの開始時刻: 2025-08-01 00:00:00 (JST) = 2025-07-31 15:00:00 (UTC)
    if start_date is None:
        start_date = datetime(2025, 7, 31, 15, 0, 0)

    # デフォルトの終了時刻: 現在時刻（UTC）
    if end_date is None:
        # 2025-11-20 20:51:46+09:00 = 2025-11-20 11:51:46+00:00
        end_date = datetime(2025, 11, 20, 11, 51, 46)

    # CSVヘッダー
    headers = ["user_id", "status_id", "started_at", "ended_at", "started_source", "ended_source", "note"]

    records = []
    previous_status_id = None
    current_time = start_date
    i = 0  # ループカウンタ
    previous_ended_microseconds = 0  # 前のレコードの終了ミリ秒
    previous_was_month_crossing = False  # 前のレコードが月跨ぎだったか


    while current_time < end_date:
        # status_id: 1-3 のランダム（遷移ルール付き）
        # 許可される遷移: 1->2, 2->1/3, 3->1/2
        # 連続（同じ値）は不可
        # 3の出現確率を低く設定（2->3は20%の確率）
        # ただし、月跨ぎの次のレコード（自動生成）は前と同じstatus_id
        if i > 0 and previous_was_month_crossing:
            # 月跨ぎの次のレコードは、分割前と同じstatus_id
            status_id = previous_status_id
        elif previous_status_id is None:
            # 最初のレコードは常に1
            status_id = 1
        elif previous_status_id == 1:
            # 1 の次は 2 のみ
            status_id = 2
        elif previous_status_id == 2:
            # 2 の次は 1 (80%) または 3 (20%)
            status_id = random.choices([1, 3], weights=[80, 20])[0]
        else:  # previous_status_id == 3
            # 3 の次は 2 (80%) または 1 (20%)
            status_id = random.choices([2, 1], weights=[80, 20])[0]

        # status_idに応じた作業時間を設定 + ランダムな秒
        if status_id == 1:
            # status_id=1: 240~2880分（4~48時間）
            work_minutes = random.randint(240, 2880)
        elif status_id == 2:
            # status_id=2: 30~480分（0.5~8時間）
            work_minutes = random.randint(30, 480)
        else:  # status_id == 3
            # status_id=3: 10~90分（10分~1.5時間）
            work_minutes = random.randint(10, 90)

        work_seconds = random.randint(0, 59)
        work_duration = timedelta(minutes=work_minutes, seconds=work_seconds)

        started_at = current_time
        ended_at = started_at + work_duration

        # 終了時刻が期間を超えた場合は、期間の終わりに設定
        if ended_at > end_date:
            ended_at = end_date

        # JST換算で月をまたぐかチェック
        started_month = get_jst_month(started_at)
        ended_month = get_jst_month(ended_at)

        if started_month != ended_month:
            # 月をまたぐ場合は、月末で分割
            month_end = get_month_end_utc(started_at)
            ended_at = month_end

        # started_source, ended_source: 1-4 のランダム（2が高確率）
        # 2: 70%, 1/3/4: 各10%
        started_source = random.choices([1, 2, 3, 4], weights=[10, 70, 10, 10])[0]
        ended_source = random.choices([1, 2, 3, 4], weights=[10, 70, 10, 10])[0]

        # 月跨ぎかどうかをチェック
        is_month_crossing = (ended_at == get_month_end_utc(started_at))

        # ミリ秒の処理
        if i == 0:
            # 最初のレコードはランダムなミリ秒
            started_microseconds = random.randint(0, 999999)
        else:
            # 2つ目以降は、前のレコードのended_atのミリ秒を引き継ぐ
            started_microseconds = previous_ended_microseconds

        started_at_with_ms = started_at.replace(microsecond=started_microseconds)

        # タイムスタンプをフォーマット
        if is_month_crossing:
            # 月末は .999000 マイクロ秒が設定されている
            ended_at_str = ended_at.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3] + "+00"
            ended_microseconds = ended_at.microsecond
        else:
            # 通常のレコードはランダムなミリ秒を追加
            ended_microseconds = random.randint(0, 999999)
            ended_at_with_ms = ended_at.replace(microsecond=ended_microseconds)
            ended_at_str = ended_at_with_ms.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3] + "+00"

        started_at_str = started_at_with_ms.strftime("%Y-%m-%d %H:%M:%S.%f")[:-3] + "+00"

        # noteの設定（月跨ぎの次のレコードの場合）
        note = ""
        if i > 0 and previous_was_month_crossing:
            note = "自動生成"

        record = {
            "user_id": user_id,
            "status_id": status_id,
            "started_at": started_at_str,
            "ended_at": ended_at_str,
            "started_source": started_source,
            "ended_source": ended_source,
            "note": note
        }

        records.append(record)

        # 次のレコードの制約チェック用に現在のstatus_idを保存
        previous_status_id = status_id

        # 次のレコード用に情報を保存
        previous_ended_microseconds = ended_microseconds
        previous_was_month_crossing = is_month_crossing

        # 次のレコードの開始時刻を設定
        if is_month_crossing:
            # 月をまたいだ場合は、次の月の最初の瞬間から開始（ミリ秒は.000）
            ended_month_jst = get_jst_month(ended_at) + 1
            ended_year_jst = (ended_at + timedelta(hours=9)).year
            if ended_month_jst > 12:
                ended_month_jst = 1
                ended_year_jst += 1
            current_time = get_month_start_utc(ended_year_jst, ended_month_jst)
            # 次のレコードのミリ秒は.000に固定
            previous_ended_microseconds = 0
        else:
            # 通常は終了時刻と同じ
            current_time = ended_at

        i += 1

    # 最後のレコードのended_atを空白にする（現在継続中のデータ）
    if records:
        last_ended_at = records[-1]['ended_at']
        records[-1]['ended_at'] = ''

    # CSVファイルに書き込み
    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        writer.writerows(records)

    print(f"✅ {len(records)}件のテストデータを {output_file} に生成しました")
    if records:
        print(f"📅 期間: {records[0]['started_at']} ～ {last_ended_at}")
        print(f"💡 最後のレコードは継続中（ended_at は空白）")

    # 月跨ぎレコードの数を表示
    month_crossing_count = sum(1 for r in records if '.999+00' in r.get('ended_at', ''))
    print(f"🗓️  月跨ぎで分割されたレコード: {month_crossing_count}件")


def main():
    # デフォルトで20件のレコードを生成
    generate_test_csv(output_file="data.csv")


if __name__ == "__main__":
    main()
