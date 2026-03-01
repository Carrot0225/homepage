import { useState } from 'react';

// お題データ
const gachaData = {
  categories: [
    {
      id: 'simple',
      name: 'シンプル系',
      items: [
        'かっこいい曲',
        'かわいい曲',
        '切ない曲',
        '明るい曲',
        'おしゃれな曲',
        'エモい曲',
        '泣ける曲',
        '元気が出る曲',
        '爽やかな曲',
        '色気のある曲',
        '激しい曲',
        '落ち着く曲',
        '壮大な曲',
        'ダークな曲',
        'ポップな曲',
        'クールな曲',
        '甘い曲',
        '儚い曲',
        '熱い曲',
        '優しい曲',
        'しっとりした曲',
        'ノスタルジックな曲',
        'ミステリアスな曲',
        '透明感のある曲',
        '力強い曲',
        'せつなかわいい曲',
        '胸が締め付けられる曲',
        'ほっこりする曲',
        'スカッとする曲',
        'じんわり来る曲',
        'アップテンポな曲',
        'スローテンポな曲',
        '踊りたくなる曲',
        'ドライブで聴きたい曲',
        '夜に聴きたい曲',
        '朝に聴きたい曲',
        '夏っぽい曲',
        '冬っぽい曲',
        '懐かしい曲',
        '神秘的な曲',
        '渋い曲',
        'キラキラした曲',
        '切なかっこいい曲',
        'ロックな曲',
        'バラード曲',
        'ジャズっぽい曲',
        'アコースティックな曲',
        'ハイトーンな曲',
        '低音が映える曲',
        'ラップがある曲',
        'ハモりたくなる曲',
        '春っぽい曲',
        '秋っぽい曲',
      ],
    },
    {
      id: 'humor',
      name: 'ユーモア系',
      subcategories: [
        {
          id: 'artist',
          name: 'アーティストの私生活妄想系',
          items: [
            '平井堅が家で聴いてそうな曲',
            '米津玄師が深夜のコンビニで聴いてそうな曲',
            'あいみょんが銭湯で鼻歌してそうな曲',
            'Official髭男dismがBBQで流してそうな曲',
            'YOASOBI二人が締切前に聴いてそうな曲',
            'Vaundyが美術館で聴いてそうな曲',
            '藤井風が実家で聴いてそうな曲',
            '宇多田ヒカルがタクシーで聴いてそうな曲',
            'King Gnuが焼肉屋で流してそうな曲',
            'back numberが失恋した友達に送りそうな曲',
            'Adoが入浴剤入れながら聴いてそうな曲',
            '星野源が料理しながら鼻歌してそうな曲',
            '椎名林檎がワイン片手に聴いてそうな曲',
          ],
        },
        {
          id: 'time',
          name: '具体的すぎる時間帯系',
          items: [
            '日曜18時のサザエさん症候群を加速させる曲',
            '金曜23時、終電逃した人間が聴く曲',
            '土曜14時、何もしてない罪悪感に寄り添う曲',
            '月曜7時、布団から出る気力をくれる曲',
            '水曜深夜2時、なんか目覚めたときに聴く曲',
            '祝日の朝、予定ないときに流す曲',
            '有給とったのに雨だった日に聴く曲',
          ],
        },
        {
          id: 'place',
          name: '場所の解像度高い系',
          items: [
            '深夜のドンキで流れてそうな曲',
            '地方のイオンのフードコートで聴きたい曲',
            '高速のサービスエリアで聴く曲',
            '誰もいない屋上で聴きたい曲',
            '閉店間際のTSUTAYAで流れてそうな曲',
            '病院の待合室でなぜか元気出る曲',
            '始発待ちのマックで聴きたい曲',
            '美容院で美容師と会話途切れたときに脳内再生する曲',
            '歯医者の治療中に脳内再生したい曲',
          ],
        },
        {
          id: 'life-event',
          name: '人生イベント系',
          items: [
            '退職届出した帰り道に聴く曲',
            '内定もらった瞬間に聴きたい曲',
            '引っ越しのダンボールに囲まれて聴く曲',
            '卒業式で泣かなかったけど帰りに泣くときの曲',
            '成人式で再会した元同級生を思い出す曲',
            '親が思ったより老けてた帰省で聴く曲',
            '結婚式の二次会で酔って聴きたい曲',
            '免許取り立てで初めて一人で運転するときの曲',
          ],
        },
        {
          id: 'love',
          name: '恋愛細分化系',
          items: [
            '好きかもって気づいた瞬間に聴く曲',
            'LINEの返信待ってる間に聴く曲',
            '既読無視されたときに聴く曲',
            '未読無視されたときに聴く曲（こっちのが怖い）',
            '元カレのSNS見ちゃったときに聴く曲',
            '元カノの結婚報告を受けたときに聴く曲',
            '付き合う前が一番楽しいときに聴く曲',
            '倦怠期に効く曲',
            '円満に別れたけど引きずってるときの曲',
            '別れたあと街で偶然会ったときに脳内で流れる曲',
            '友達以上恋人未満で止まってるときの曲',
          ],
        },
        {
          id: 'nostalgia',
          name: '年代ノスタルジー系',
          items: [
            '2007年の着うたに入ってた感じの曲',
            '2012年のニコニコ全盛期っぽい曲',
            'ガラケーで撮った写真見返す気分の曲',
            'MDプレイヤーに入れてた感じの曲',
            'iPod nanoの思い出が蘇る曲',
            'ワンセグで見た音楽番組を思い出す曲',
            'TSUTAYAで5枚1000円レンタルしてた頃の曲',
            '友達のウォークマンで初めて聴いた感じの曲',
          ],
        },
        {
          id: 'student',
          name: '学生時代系',
          items: [
            '文化祭の後夜祭で泣くやつが聴く曲',
            '部活帰りの夕焼けに聴く曲',
            '受験期に封印してた曲',
            '修学旅行のバスで誰かが流す曲',
            '好きな人と帰り道一緒のときに脳内再生する曲',
            '自習時間にイヤホン片耳で聴く曲',
            '先生にバレないように聴いてた曲',
            '合唱コンクールで歌いたかった曲',
          ],
        },
        {
          id: 'emotion',
          name: '感情むき出し系',
          items: [
            'エモで殴ってほしいときの曲',
            '闇落ち中に聴く曲',
            '浄化されたいときの曲',
            '何も考えたくないときに聴く曲',
            '泣きたいけど泣けないときの曲',
            '叫びたいときに聴く曲',
            '人類全員敵だと思ってるときの曲',
            '自己肯定感が床のときに聴く曲',
            '推しが尊すぎて昇天するときの曲',
            'なんか知らんけど泣ける曲',
          ],
        },
        {
          id: 'pinpoint',
          name: '謎にピンポイント系',
          items: [
            '歌詞の意味あとから知って鳥肌立つ曲',
            'カラオケで入れたけど歌えなかった曲',
            'サビしか知らないけど好きな曲',
            'タイトル知らなかったけど神曲だった曲',
            'TikTokで知ったけど原曲派になった曲',
            'アニメ見てないけど曲だけ好きな曲',
            'MV込みで完成する曲',
            'ライブで聴いたら印象変わった曲',
          ],
        },
        {
          id: 'weather',
          name: '天気・季節系',
          items: [
            '雨の日に窓際で聴きたい曲',
            '台風の夜になぜかテンション上がる曲',
            '夏の終わりの切なさを加速させる曲',
            '冬の朝、息が白いときに聴く曲',
            '桜散り始めた頃に聴く曲',
            '8月31日の夜に聴く曲',
            '年越し直前のカウントダウンで聴きたい曲',
            '正月三日目、暇すぎるときに聴く曲',
          ],
        },
        {
          id: 'sns',
          name: 'SNS・ネット系',
          items: [
            'インスタのストーリーに使いたい曲',
            'TikTokでバズりそうな曲',
            '深夜のTwitter（X）で呟きたくなる曲',
            'YouTubeの作業用BGMにありそうな曲',
            'Spotifyの「あなたへのおすすめ」に出てきそうな曲',
          ],
        },
        {
          id: 'work',
          name: '仕事・社会人系',
          items: [
            '上司に怒られた帰り道に聴く曲',
            'リモートワーク3日目に聴く曲',
            '給料日に聴きたい曲',
            '日曜の夜、明日からまた仕事だと思うと聴きたくなる曲',
            '有給消化中に聴く曲',
            '転職サイト見ながら聴く曲',
          ],
        },
        {
          id: 'food',
          name: '食べ物・飲み物系',
          items: [
            'ラーメン食べながら聴きたい曲',
            '深夜のカップ麺に合う曲',
            '一人焼肉で流したい曲',
            'コンビニスイーツ食べながら聴く曲',
            '二日酔いの朝に聴く曲',
          ],
        },
        {
          id: 'home',
          name: '家・一人暮らし系',
          items: [
            '一人暮らしの部屋で聴く曲',
            '実家に帰りたくなる曲',
            '掃除のやる気が出る曲',
            'お風呂で熱唱したい曲',
            '布団から出られない朝に聴く曲',
          ],
        },
        {
          id: 'relationship',
          name: '人間関係系',
          items: [
            '友達と夜通し語り合うときに流す曲',
            '久しぶりに会う友達を待ってるときの曲',
            '推しの配信待機中に聴く曲',
            '親に感謝したくなる曲',
            '一人でいたいときに聴く曲',
          ],
        },
        {
          id: 'transport',
          name: '乗り物系',
          items: [
            '終電で聴きたい曲',
            '新幹線の窓から外を見ながら聴く曲',
            '自転車で風を切りながら聴く曲',
            '深夜バスで眠れないときに聴く曲',
            '飛行機が離陸するときに聴きたい曲',
          ],
        },
        {
          id: 'shopping',
          name: '買い物・お出かけ系',
          items: [
            '一人でショッピングモールにいるときの曲',
            '本屋で流れてそうな曲',
            '映画館で予告前に流れてほしい曲',
            'カフェで作業中に聴きたい曲',
            '古着屋で流れてそうな曲',
          ],
        },
        {
          id: 'late-night',
          name: '深夜テンション系',
          items: [
            '深夜3時に聴くと泣ける曲',
            '寝る前に聴いたら眠れなくなる曲',
            '深夜テンションで友達に送りつけたくなる曲',
            '明日早いのに夜更かししちゃうときの曲',
            '深夜のコンビニ帰りに聴く曲',
          ],
        },
        {
          id: 'movie',
          name: '映画・ドラマ・アニメ系',
          items: [
            '映画のエンドロールで流れてほしい曲',
            '青春映画のクライマックスで流れそうな曲',
            '深夜アニメのOPっぽい曲',
            '恋愛ドラマの告白シーンで流れる曲',
            '人生のダイジェストムービーに使いたい曲',
          ],
        },
        {
          id: 'game',
          name: 'ゲーム系',
          items: [
            'RPGの旅立ちのシーンに合う曲',
            'ゲームのエンディングで泣く曲',
          ],
        },
        {
          id: 'karaoke',
          name: 'カラオケ系',
          items: [
            'カラオケで盛り上がる曲',
            'カラオケのラストに歌いたい曲',
            '一人カラオケで熱唱したい曲',
            'みんなで合唱できる曲',
            'カラオケで歌うと気持ちいい曲',
          ],
        },
        {
          id: 'generation',
          name: '世代・年齢系',
          items: [
            '10代に聴いてほしい曲',
            '20代のうちに聴いておきたい曲',
            '大人になってから良さがわかる曲',
            '学生時代に戻りたくなる曲',
            '人生の節目に聴きたい曲',
          ],
        },
        {
          id: 'condition',
          name: 'コンディション系',
          items: [
            'やる気が出ないときに聴く曲',
            '緊張をほぐしたいときに聴く曲',
            '集中したいときに聴く曲',
          ],
        },
        {
          id: 'mental',
          name: 'メンタル回復系',
          items: [
            '失敗したときに聴く曲',
            '自信をなくしたときに聴く曲',
            '明日から頑張ろうと思える曲',
            '生きててよかったと思える曲',
            '背中を押してほしいときの曲',
          ],
        },
      ],
    },
  ],
};

// お題をカテゴリ別にフラット化
interface FlatItem {
  text: string;
  category: string;
}

const getItemsByCategory = (categoryId: string): FlatItem[] => {
  const items: FlatItem[] = [];
  const category = gachaData.categories.find((c) => c.id === categoryId);

  if (!category) return items;

  if ('items' in category && category.items) {
    category.items.forEach((item) => {
      items.push({ text: item, category: category.name });
    });
  }
  if ('subcategories' in category && category.subcategories) {
    category.subcategories.forEach((sub) => {
      sub.items.forEach((item) => {
        items.push({ text: item, category: category.name });
      });
    });
  }

  return items;
};

const simpleItems = getItemsByCategory('simple');
const humorItems = getItemsByCategory('humor');

interface HistoryItem {
  text: string;
  category: string;
  id: number;
}

type CategoryType = 'simple' | 'humor';

export default function SongGacha() {
  const [result, setResult] = useState<FlatItem | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyId, setHistoryId] = useState(0);

  const spin = (categoryType: CategoryType) => {
    if (isSpinning) return;

    const items = categoryType === 'simple' ? simpleItems : humorItems;

    setIsSpinning(true);
    setResult(null);

    // 抽選演出（1.5秒）
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * items.length);
      const selected = items[randomIndex];

      setResult(selected);
      setIsSpinning(false);

      // 履歴に追加（最大10件）
      setHistory((prev) => {
        const newHistory = [
          { ...selected, id: historyId },
          ...prev,
        ].slice(0, 10);
        return newHistory;
      });
      setHistoryId((prev) => prev + 1);
    }, 1500);
  };

  return (
    <div className="song-gacha">
      <div className="gacha-container">
        <h1 className="gacha-title">
          <span className="title-icon">🎤</span>
          今日の歌お題ガチャ
        </h1>
        <p className="gacha-subtitle">ボタンを押してお題を引こう！</p>

        {/* 結果表示エリア */}
        <div className={`result-area ${result ? 'has-result' : ''} ${isSpinning ? 'spinning' : ''}`}>
          {isSpinning ? (
            <div className="spinning-text">
              <span>ガチャガチャ</span>
              <span className="dots">...</span>
            </div>
          ) : result ? (
            <div className="result-content">
              <span className="result-category">{result.category}</span>
              <p className="result-text">「{result.text}」</p>
            </div>
          ) : (
            <div className="empty-result">
              <span>？</span>
            </div>
          )}
        </div>

        {/* ガチャボタン */}
        <div className="gacha-buttons">
          <button
            className={`gacha-button simple ${isSpinning ? 'disabled' : ''}`}
            onClick={() => spin('simple')}
            disabled={isSpinning}
          >
            {isSpinning ? '抽選中...' : 'シンプル系'}
          </button>
          <button
            className={`gacha-button humor ${isSpinning ? 'disabled' : ''}`}
            onClick={() => spin('humor')}
            disabled={isSpinning}
          >
            {isSpinning ? '抽選中...' : 'ユーモア系'}
          </button>
        </div>

        {/* 履歴 */}
        {history.length > 0 && (
          <div className="history-section">
            <h2 className="history-title">
              <span className="history-icon">📝</span>
              これまでの結果
            </h2>
            <ul className="history-list">
              {history.map((item) => (
                <li key={item.id} className="history-item">
                  <span className="history-category">{item.category}</span>
                  <span className="history-text">「{item.text}」</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
