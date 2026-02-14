export const UNPRINTABLE_VALUE = {
  toString() {
    throw new Error('cannot stringify');
  },
};
