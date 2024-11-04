declare module 'pdf2img-promises' {
  interface ConvertOptions {
    /** Output directory path */
    output_dir: string;
    /** Output filename */
    outputname: string;
    /** Page numbers to convert. Default is [1] */
    page_numbers?: number[];
    /** Maximum size (width or height) of the output image */
    size?: number;
    /** Output format. Default is 'png' */
    format?: 'png' | 'jpg';
    /** Output quality (1-100). Default is 100 */
    quality?: number;
  }

  interface PDF2Image {
    /**
     * Convert PDF pages to images
     * @param input_path Path to the input PDF file
     * @param options Conversion options
     */
    convert(input_path: string, options: ConvertOptions): Promise<void>;
  }

  const pdf2img: PDF2Image;
  export default pdf2img;
}
