// Minimal Jest stand-in for react-native-reanimated (v4's own mock needs native worklets).
const React = require('react');
const { View, Text, Image, ScrollView } = require('react-native');

const useSharedValue = (v) => React.useRef({ value: v }).current;
const useAnimatedStyle = (fn) => fn();
const withTiming = (to, _cfg, cb) => { if (cb) cb(true); return to; };
const withRepeat = (v) => v;
const bezier = () => (t) => t;
const Easing = { bezier, out: (f) => f, in: (f) => f, inOut: (f) => f, ease: (t) => t, linear: (t) => t };
const interpolate = (x, input, output) => {
  const t = Math.min(1, Math.max(0, (x - input[0]) / (input[1] - input[0])));
  return output[0] + (output[1] - output[0]) * t;
};
const interpolateColor = (x, input, output) => (x >= input[input.length - 1] ? output[output.length - 1] : output[0]);
const useAnimatedProps = (fn) => fn();
const useAnimatedReaction = () => {}; // the reaction only mirrors UI-thread values into React state
const runOnJS = (fn) => fn;
const createAnimatedComponent = (C) => C;
const Animated = { View, Text, Image, ScrollView, createAnimatedComponent };

module.exports = {
  __esModule: true,
  default: Animated,
  ...Animated,
  createAnimatedComponent, useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing, interpolate, interpolateColor, useAnimatedProps, useAnimatedReaction, runOnJS,
};
