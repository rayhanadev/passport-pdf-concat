import fs from "node:fs";
import imageToPDF from "image-to-pdf";
import ora from "ora";
import sade from "sade";

import { dataPageGenerationPipeline } from "./image";

const cli = sade("passports <start> <end>", true)
  .version("0.0.1")
  .describe("Concatenate Passport data pages into a single PDF")
  .action(async (start, end) => {
    const spinner = ora(`Fetching data pages ${start} to ${end}`).start();

    // Run the data page generation pipeline
    const renderedImages = await dataPageGenerationPipeline({
      start,
      end,
      spinner,
    });

    // Convert the rendered images to a PDF
    imageToPDF(renderedImages, imageToPDF.sizes.LETTER)
      .pipe(fs.createWriteStream("output.pdf"))
      .on("finish", () => {
        spinner.succeed("Data pages saved to output.pdf");
      });
  });

cli.parse(process.argv);
