import { Resvg } from "@resvg/resvg-js";
import satori, { type SatoriOptions } from "satori";

const IMAGE_GENERATION_SCALE_FACTOR = 3;
const PASSPORTS_PER_PAGE = 2;
const DATA_PAGE_TOP_HALF_URL =
  "https://data.passports.purduehackers.com/page-1-second-half.png";
const FONTS = [
  {
    name: "Inter",
    url: `file://${process.cwd()}/assets/Inter-Regular.ttf`,
  },
  {
    name: "Inter Bold",
    url: `file://${process.cwd()}/assets/Inter-Bold.ttf`,
  },
  {
    name: "OCR B",
    url: `file://${process.cwd()}/assets/OCRB-Regular.ttf`,
  },
];
const SATORI_CONFIG = {
  width: 2551,
  height: 3295,
  fonts: [
    ...(await Promise.all(
      FONTS.map(async (data) => ({
        name: data.name,
        data: await fetch(data.url).then((res) => res.arrayBuffer()),
      }))
    )),
  ],
} satisfies SatoriOptions;

const getDataPageUrl = (page: string) =>
  new URL(`/${page}.png`, "https://data.passports.purduehackers.com");

export async function generateDataPageImage(page: number): Promise<React.FC> {
  const dataPageUrl = getDataPageUrl(String(page)).toString();

  return function DataPage() {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          backgroundColor: "#ffffff",
          gap: 0,
          width: 324.63 * 2 * IMAGE_GENERATION_SCALE_FACTOR,
          height: 475.86 * IMAGE_GENERATION_SCALE_FACTOR,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 324.63 * IMAGE_GENERATION_SCALE_FACTOR,
            height: 475.86 * IMAGE_GENERATION_SCALE_FACTOR,
          }}
        >
          <img
            src={dataPageUrl}
            alt="data page"
            width={475.86 * IMAGE_GENERATION_SCALE_FACTOR}
            height={324.63 * IMAGE_GENERATION_SCALE_FACTOR}
            style={{
              transform: "rotate(90deg) translateY(-100%)",
              transformOrigin: "top left",
            }}
          />
        </div>
        <img
          src={DATA_PAGE_TOP_HALF_URL}
          alt="second half"
          width={324.63 * IMAGE_GENERATION_SCALE_FACTOR}
          height={475.86 * IMAGE_GENERATION_SCALE_FACTOR}
        />
      </div>
    );
  };
}

export async function concatDataPages(...pages: React.FC[]) {
  const pageGroups = [];
  for (let i = 0; i < pages.length; i += PASSPORTS_PER_PAGE) {
    pageGroups.push(pages.slice(i, i + PASSPORTS_PER_PAGE));
  }

  const images = [];
  for (let i = 0; i < pageGroups.length; i++) {
    const pageGroup = pageGroups[i];
    const pageGroupImage = (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "flex-start",
          backgroundColor: "#ffffff",
          gap: 50,
          width: "2551px",
          height: "3295px",
        }}
      >
        {pageGroup.map((Page, index) => (
          <Page key={index} />
        ))}
      </div>
    );

    images.push(pageGroupImage);
  }

  return images;
}

export async function render(...images: JSX.Element[]) {
  const renderedImages = await Promise.all(
    images.map((image) => {
      return satori(image, SATORI_CONFIG).then((res) => {
        const resvg = new Resvg(res);
        return resvg.render().asPng();
      });
    })
  );

  return renderedImages;
}
