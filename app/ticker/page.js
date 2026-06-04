import Ticker from "../components/Ticker";

const DEFAULT_TEXT =
  "दिल्ली के मालवीय नगर स्थित एक 5 मंजिला होटल में बुधवार को सुबह भीषण आग लगने से 21 लोगों की मौत हो गई। इस घटना को लेकर पुलिस ने केस दर्ज कर लिया है। दिल्ली पुलिस के साथ एमसीडी भी जांच में जुट गई है।";

export default async function TickerPage({ searchParams }) {
  const params = await searchParams;
  const text = params?.text || DEFAULT_TEXT;
  const speed = params?.speed || 28;
  const fontSize = params?.fontSize || 42;
  const height = params?.height || 108;
  const bottom = params?.bottom || 64;
  const canvasWidth = params?.canvasWidth || 1920;
  const canvasHeight = params?.canvasHeight || 1080;
  const stripColor = params?.stripColor || "#f7f7f7";
  const fontColor = params?.fontColor || "#111820";
  const fontFamily = params?.fontFamily || "Arial";

  return (
    <main className="output-page">
      <Ticker
        text={text}
        speed={speed}
        fontSize={fontSize}
        height={height}
        bottom={bottom}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        stripColor={stripColor}
        fontColor={fontColor}
        fontFamily={fontFamily}
      />
    </main>
  );
}
