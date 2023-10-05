import { useEffect, useRef } from "react";
import { Spinner, match, unreachable, useColorScheme } from "@opencast/appkit";
import { useTranslation } from "react-i18next";

import { COLORS, dimensionsOf } from "../../util";
import { StreamSettings } from "./prefs";
import { Input } from ".";
import { VideoBox, useVideoBoxResize } from "../../ui/VideoBox";
import { ErrorBox } from "../../ui/ErrorBox";



export type SourcePreviewProps = {
  inputs: Input[];
}

/**
 * Shows the preview for one or two input streams. The previews also show
 * preferences allowing the user to change the webcam and the like.
 */
export const SourcePreview: React.FC<SourcePreviewProps> = ({ inputs }) => {
  const children = match(inputs.length, {
    1: () => [{
      body: <StreamPreview input={inputs[0]} />,
      dimensions: () => dimensionsOf(inputs[0].stream),
      autoSize: inputHasError(inputs[0]),
    }],
    2: () => [
      {
        body: <StreamPreview input={inputs[0]} />,
        dimensions: () => dimensionsOf(inputs[0].stream),
        autoSize: inputHasError(inputs[0]),
      },
      {
        body: <StreamPreview input={inputs[1]} />,
        dimensions: () => dimensionsOf(inputs[1].stream),
        autoSize: inputHasError(inputs[1]),
      },
    ],
  }, unreachable);

  return <VideoBox gap={20}>{children}</VideoBox>;
};

const inputHasError = (input: Input): boolean =>
  input.allowed === false || !!input.unexpectedEnd;

/** Shows a single stream as preview, deals with potential errors and shows preferences UI */
const StreamPreview: React.FC<{ input: Input }> = ({ input }) => {
  const { isHighContrast } = useColorScheme();

  return (
    <div css={{
      height: "100%",
      backgroundColor: COLORS.neutral05,
      borderRadius: 12,
      position: "relative",
      ...!inputHasError(input) && {
        boxShadow: isHighContrast ? "none" : "0 6px 16px rgba(0, 0, 0, 0.2)",
      },
      ...isHighContrast && {
        outline: `1px solid ${COLORS.neutral90}`,
      },
    }}>
      <PreviewVideo input={input} />
      {input.stream && <StreamSettings isDesktop={input.isDesktop} stream={input.stream} />}
    </div>
  );
};

const PreviewVideo: React.FC<{ input: Input }> = ({ input }) => {
  const { t } = useTranslation();
  const { allowed, stream, unexpectedEnd } = input;
  const resizeVideoBox = useVideoBoxResize();

  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      if (!v.srcObject) {
        v.srcObject = stream;
      }
      v.addEventListener("resize", resizeVideoBox);
    }

    return () => {
      if (v) {
        v.removeEventListener("resize", resizeVideoBox);
      }
    };
  }, [stream, resizeVideoBox]);

  if (!stream) {
    let inner: JSX.Element;
    if (allowed === false || unexpectedEnd) {
      inner = <div>
        {allowed === false && <ErrorBox
          css={{ margin: 0 }}
          title={t(`steps.video.${input.isDesktop ? "display" : "user"}-not-allowed-title`)}
          body={t(`steps.video.${input.isDesktop ? "display" : "user"}-not-allowed-text`)}
        />}
        {/* TODO: differentiate between desktop and camera for better error */}
        {unexpectedEnd && <ErrorBox css={{ margin: 0 }} body={t("error-lost-video-stream")} />}
      </div>;
    } else {
      inner = <Spinner size={75} css={{ color: COLORS.neutral60 }} />;
    }

    return (
      <div css={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      }}>
        <div css={{
          flex: "1",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
          {inner}
        </div>
      </div>
    );
  }

  return (
    <div css={{
      position: "relative",
    }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        css={{
          minHeight: 0,
          display: "block",
          width: "100%",
          height: "100%",
          borderRadius: 12,
        }}
      />
    </div>
  );
};
