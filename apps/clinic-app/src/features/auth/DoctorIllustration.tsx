import Svg, { Circle, Defs, Path, LinearGradient as SvgLinearGradient, Stop } from "react-native-svg";

// Stylised bust — coat collar + stethoscope — rendered as flat gradient
// shapes. Each shape's own opacity tapers toward the bottom so it still
// reads as ambient art fading into the background, without relying on
// react-native-svg's <Mask> (a much less battle-tested feature that isn't
// worth the risk for a purely decorative illustration).
export function DoctorIllustration({ width = 300, height = 260 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 300 260">
      <Defs>
        <SvgLinearGradient id="coatGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#B8A3FF" stopOpacity={0.5} />
          <Stop offset="100%" stopColor="#8B5CFF" stopOpacity={0} />
        </SvgLinearGradient>
        <SvgLinearGradient id="headGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#D9CCFF" stopOpacity={0.6} />
          <Stop offset="100%" stopColor="#B8A3FF" stopOpacity={0.32} />
        </SvgLinearGradient>
      </Defs>
      <Path d="M40 258C40 178 88 132 150 132C212 132 260 178 260 258" fill="url(#coatGrad)" />
      <Path d="M150 132L150 210L122 168Z" fill="#140B2C" fillOpacity={0.2} />
      <Path d="M150 132L150 210L178 168Z" fill="#140B2C" fillOpacity={0.13} />
      <Circle cx={150} cy={76} r={52} fill="url(#headGrad)" />
      {/* Stethoscope: two tubes drape from behind the neck down each side
          of the chest, meet at a Y-joint, then a single tube hangs to the
          chestpiece — the way it actually sits on a doctor, not a collar-
          level loop. */}
      <Path
        d="M128 134C120 158 124 178 150 196"
        stroke="#EDE6FF"
        strokeOpacity={0.5}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M172 134C180 158 176 178 150 196"
        stroke="#EDE6FF"
        strokeOpacity={0.5}
        strokeWidth={5}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={128} cy={134} r={4} fill="#EDE6FF" fillOpacity={0.45} />
      <Circle cx={172} cy={134} r={4} fill="#EDE6FF" fillOpacity={0.45} />
      <Path d="M150 196V218" stroke="#EDE6FF" strokeOpacity={0.4} strokeWidth={5} strokeLinecap="round" />
      <Circle cx={150} cy={226} r={12} fill="#EDE6FF" fillOpacity={0.3} />
      <Circle cx={150} cy={226} r={6} fill="#EDE6FF" fillOpacity={0.45} />
    </Svg>
  );
}
