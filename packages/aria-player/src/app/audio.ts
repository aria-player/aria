type AudioBufferInfo = {
  buffer: AudioBuffer;
  fileUrl: string;
};

export function createWebAudioBackend(props: {
  onFinishedPlayback: () => void;
}) {
  let audioContext = new AudioContext();
  let sourceNode = audioContext.createBufferSource();
  let gainNode = audioContext.createGain();
  let primaryBufferInfo: AudioBufferInfo | null;
  let secondaryBufferInfo: AudioBufferInfo | null;
  let primaryAbortController: AbortController | null = null;
  let secondaryAbortController: AbortController | null = null;
  let resumePosition: number | null = null;

  async function loadAudioBuffer(
    file: string,
    signal: AbortSignal
  ): Promise<AudioBuffer> {
    const response = await fetch(file, { signal });
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
  }

  function playPrimaryBuffer(
    startPosition: number,
    volume: number,
    closeAudioContext: boolean
  ) {
    if (!primaryBufferInfo) return;
    if (closeAudioContext) {
      audioContext?.close();
    }
    audioContext = new window.AudioContext();
    sourceNode = audioContext.createBufferSource();
    gainNode = audioContext.createGain();
    gainNode.gain.value = volume;
    sourceNode.buffer = primaryBufferInfo.buffer;
    sourceNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    sourceNode.start(0, startPosition);
    sourceNode.onended = async () => {
      if (secondaryBufferInfo) {
        primaryBufferInfo = secondaryBufferInfo;
        secondaryBufferInfo = null;
      }
      playPrimaryBuffer(0, gainNode.gain.value, false);
      props.onFinishedPlayback();
    };
  }

  return {
    async loadPrimaryAudioFile(
      fileUrl: string,
      file: string,
      volume: number
    ): Promise<number | null> {
      primaryAbortController?.abort();
      primaryAbortController = new AbortController();
      const signal = primaryAbortController.signal;
      resumePosition = null;
      if (primaryBufferInfo?.fileUrl == fileUrl) {
        return null;
      }
      if (secondaryBufferInfo?.fileUrl === fileUrl) {
        const newDuration = secondaryBufferInfo.buffer.duration * 1000;
        primaryBufferInfo = secondaryBufferInfo;
        secondaryBufferInfo = null;
        playPrimaryBuffer(0, volume / 100, true);
        return newDuration;
      }
      await audioContext.suspend();
      try {
        const buffer = await loadAudioBuffer(file, signal);
        primaryBufferInfo = {
          buffer,
          fileUrl
        };
        playPrimaryBuffer(0, volume / 100, true);
        return primaryBufferInfo.buffer.duration * 1000;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // Cancelled load
        } else {
          console.error("Error loading audio:", error);
        }
        return null;
      }
    },

    async loadSecondaryAudioFile(fileUrl: string, file: string) {
      secondaryAbortController?.abort();
      secondaryAbortController = new AbortController();
      const signal = secondaryAbortController.signal;
      try {
        const buffer = await loadAudioBuffer(file, signal);
        secondaryBufferInfo = {
          buffer,
          fileUrl
        };
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          // Cancelled load
        } else {
          console.error("Error preloading audio:", error);
        }
      }
    },

    clearSecondaryAudioFile() {
      secondaryBufferInfo = null;
      secondaryAbortController?.abort();
    },

    pause() {
      audioContext?.suspend();
    },

    resume() {
      if (resumePosition != null) {
        playPrimaryBuffer(resumePosition / 1000, gainNode.gain.value, true);
        resumePosition = null;
      } else {
        audioContext?.resume();
      }
    },

    setVolume(volume: number) {
      gainNode.gain.value = volume;
    },

    setTime(position: number) {
      if (!primaryBufferInfo) throw Error("Audio buffer not available");
      if (audioContext && audioContext.state == "running") {
        playPrimaryBuffer(position / 1000, gainNode.gain.value, true);
      } else {
        resumePosition = position;
      }
    },

    dispose() {
      audioContext?.close();
    }
  };
}
