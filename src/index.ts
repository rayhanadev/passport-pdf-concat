import fs from "node:fs";
import imageToPDF from "image-to-pdf";
import ora from "ora";
import sade from "sade";

import { generateDataPageImage, concatDataPages, render } from "./image";

const cli = sade("passports <start> <end>", true)
  .version("0.0.1")
  .describe("Concatenate two strings")
  .action(async (start, end) => {
    const spinner = ora(`Fetching data pages ${start} to ${end}`).start();

    const images = [];

    for (let i = parseInt(start); i <= parseInt(end); i++) {
      spinner.text = `Generating data page ${i}/${end}`;

      const image = await generateDataPageImage(i);
      images.push({
        data: image,
        number: i,
      });
    }

    spinner.text = "Concatenating data pages";

    const pages = await concatDataPages(...images.map((image) => image.data));

    spinner.text = "Rendering data pages";
    const renderedImages = await render(...pages);

    imageToPDF(renderedImages, imageToPDF.sizes.LETTER)
      .pipe(fs.createWriteStream("output.pdf"))
      .on("finish", () => {
        spinner.succeed("Data pages saved to output.pdf");
      });
  });

cli.parse(process.argv);
