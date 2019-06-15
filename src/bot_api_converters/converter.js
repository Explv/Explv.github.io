/* eslint-disable class-methods-use-this */
/* eslint-disable no-unused-vars */
import $ from 'jquery';

export default class Converter {
  fromJava(text, drawable) {}

  toJava(drawable) {
    const outputType = $('#output-type').val();

    switch (outputType) {
      case 'Array':
        return this.toJavaArray(drawable);
      case 'List':
        return this.toJavaList(drawable);
      case 'Arrays.asList':
        return this.toJavaArraysAsList(drawable);
      case 'Raw':
        return this.toRaw(drawable);
      default:
        throw new Error(`Unexpected output type '${outputType}'`);
    }
  }

  toRaw(drawable) {}

  toJavaSingle(drawable) {}

  toJavaArray(drawable) {}

  toJavaList(drawable) {}

  toJavaArraysAsList(drawable) {}
}
