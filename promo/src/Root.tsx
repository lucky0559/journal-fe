import { Composition, Folder } from "remotion";
import { Promo } from "./Promo";
import { PROMO_V2_FRAMES, PromoV2 } from "./PromoV2";
import { Friends } from "./scenes/Friends";
import { HookLumi } from "./scenes/HookLumi";
import { Stickers } from "./scenes/Stickers";
import { FeatureGraphic } from "./scenes/FeatureGraphic";
import { Hook } from "./scenes/Hook";
import { Month } from "./scenes/Month";
import { Mood } from "./scenes/Mood";
import { Outro } from "./scenes/Outro";
import { Private } from "./scenes/Private";
import { Write } from "./scenes/Write";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="JournalPromo" component={Promo} width={1080} height={1920} fps={30} durationInFrames={870} />
      <Composition id="JournalPromoWide" component={Promo} width={1920} height={1080} fps={30} durationInFrames={870} />
      <Composition id="JournalPromoV2" component={PromoV2} width={1080} height={1920} fps={30} durationInFrames={PROMO_V2_FRAMES} />
      <Composition id="JournalPromoV2Wide" component={PromoV2} width={1920} height={1080} fps={30} durationInFrames={PROMO_V2_FRAMES} />
      <Composition id="FeatureGraphic" component={FeatureGraphic} width={1024} height={500} fps={30} durationInFrames={90} />
      <Folder name="Scenes">
        <Composition id="Hook" component={Hook} width={1080} height={1920} fps={30} durationInFrames={144} />
        <Composition id="Mood" component={Mood} width={1080} height={1920} fps={30} durationInFrames={184} />
        <Composition id="Write" component={Write} width={1080} height={1920} fps={30} durationInFrames={184} />
        <Composition id="Month" component={Month} width={1080} height={1920} fps={30} durationInFrames={144} />
        <Composition id="Private" component={Private} width={1080} height={1920} fps={30} durationInFrames={184} />
        <Composition id="Outro" component={Outro} width={1080} height={1920} fps={30} durationInFrames={150} />
      </Folder>
      <Folder name="Scenes-V2">
        <Composition id="HookLumi" component={HookLumi} width={1080} height={1920} fps={30} durationInFrames={144} />
        <Composition id="Stickers" component={Stickers} width={1080} height={1920} fps={30} durationInFrames={184} />
        <Composition id="Friends" component={Friends} width={1080} height={1920} fps={30} durationInFrames={224} />
        <Composition id="HookLumiWide" component={HookLumi} width={1920} height={1080} fps={30} durationInFrames={144} />
        <Composition id="StickersWide" component={Stickers} width={1920} height={1080} fps={30} durationInFrames={184} />
        <Composition id="FriendsWide" component={Friends} width={1920} height={1080} fps={30} durationInFrames={224} />
      </Folder>
      <Folder name="Scenes-Wide">
        <Composition id="HookWide" component={Hook} width={1920} height={1080} fps={30} durationInFrames={144} />
        <Composition id="MoodWide" component={Mood} width={1920} height={1080} fps={30} durationInFrames={184} />
        <Composition id="WriteWide" component={Write} width={1920} height={1080} fps={30} durationInFrames={184} />
        <Composition id="MonthWide" component={Month} width={1920} height={1080} fps={30} durationInFrames={144} />
        <Composition id="PrivateWide" component={Private} width={1920} height={1080} fps={30} durationInFrames={184} />
        <Composition id="OutroWide" component={Outro} width={1920} height={1080} fps={30} durationInFrames={150} />
      </Folder>
    </>
  );
};
