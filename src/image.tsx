import { Resvg } from "@resvg/resvg-js";
import type { Ora } from "ora";
import satori, { type SatoriOptions } from "satori";

// DPI used for printing. 1200 DPI is a common value for high-quality printing,
// however this can be adjusted to fit your needs. When printing from Chrome the
// highest DPI is 1200.
const DPI = 1200;
const IMAGE_GENERATION_SCALE_FACTOR = 3.21;
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

const getDataPageUrl = (page: string) =>
  new URL(`/${page}.png`, "https://data.passports.purduehackers.com");

/**
 * Generates a React component that represents a data page.
 * @param page {number} The page number to generate the data page for.
 * @returns {Promise<React.FC>} A React functional component that represents the data page.
 */
async function generateDataPageComponent(page: number): Promise<React.FC> {
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

/**
 * Generates a printable page from a list DataPage components.
 * @param pages {React.FC[]} The list of DataPage components to generate the printable page from.
 * @returns {Promise<JSX.Element>} A React element that represents the printable page.
 */
async function generatePrintablePages(
  ...pages: React.FC[]
): Promise<JSX.Element> {
  if (pages.length > PASSPORTS_PER_PAGE) {
    throw new Error("Too many data pages to fit on a single printable page");
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        backgroundColor: "#ffffff",
        gap: 50,
        width: `${8.5 * DPI}px`,
        height: `${11 * DPI}px`,
      }}
    >
      {pages.map((Page, index) => (
        <Page key={index} />
      ))}
    </div>
  );
}

/**
 * Renders a page as an image using Satori.
 * @param image {JSX.Element} The page to render as an image.
 * @returns {Promise<Buffer>} A promise that resolves to a buffer containing the rendered image.
 */
async function renderPageAsImage(image: JSX.Element) {
  const SATORI_CONFIG = {
    width: 2551,
    height: 3295,
    fonts: [
      ...(await Promise.all(
        FONTS.map(async (data) => ({
          name: data.name,
          data: await fetch(data.url).then((res) => res.arrayBuffer()),
        })),
      )),
    ],
  } satisfies SatoriOptions;

  return satori(image, SATORI_CONFIG).then((res) => {
    const resvg = new Resvg(res);
    return resvg.render().asPng();
  });
}

/**
 * Generates a list of data pages and renders them as images.
 * @param {Object} params - The parameters for the function.
 * @param {number} params.start - The passport ID to start pulling from.
 * @param {number} params.end - The passport ID to stop pulling from.
 * @param {Ora} [params.spinner] - An optional Ora spinner instance for showing progress.
 * @returns {Promise<Buffer[]>} A promise that resolves to a list of buffers containing the rendered images.
 */
export async function dataPageGenerationPipeline({
  start,
  end,
  spinner,
}: {
  start: number;
  end: number;
  spinner?: Ora;
}): Promise<Buffer[]> {
  const dataPages = [];
  for (let i = start; i <= end; i++) {
    if (spinner) {
      spinner.text = `Generating data pages ${i} of ${end}`;
    }
    const DataPage = await generateDataPageComponent(i);
    dataPages.push(DataPage);
  }

  if (spinner) {
    spinner.text = "Chunking data pages";
  }
  const chunkedDataPages = [];
  for (let i = 0; i < dataPages.length; i += PASSPORTS_PER_PAGE) {
    chunkedDataPages.push(dataPages.slice(i, i + PASSPORTS_PER_PAGE));
  }

  const renderedPages = [];
  for (const i in chunkedDataPages) {
    const chunk = chunkedDataPages[i];
    if (spinner) {
      spinner.text = `Rendering pages ${i} of ${chunkedDataPages.length}`;
    }
    const printablePage = await generatePrintablePages(...chunk);
    const image = await renderPageAsImage(printablePage);
    renderedPages.push(image);
  }

  if (spinner) {
    spinner.text = "Data pages generated";
  }
  return renderedPages;
}
