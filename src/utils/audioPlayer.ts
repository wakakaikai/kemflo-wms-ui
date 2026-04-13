import warningsMp3 from '@/assets/MP3/warnings.mp3';
import successMp3 from '@/assets/MP3/success.mp3';

class AudioPlayer {
  private warningAudio: HTMLAudioElement;
  private successAudio: HTMLAudioElement;

  constructor() {
    this.warningAudio = new Audio(warningsMp3);
    this.successAudio = new Audio(successMp3);
  }

  /**
   * 播放预警声音
   */
  public playWarning(): void {
    this.warningAudio.currentTime = 0;
    this.warningAudio.play().catch((error) => {
      console.error('预警声音播放失败:', error);
    });
  }

  /**
   * 播放成功声音
   */
  public playSuccess(): void {
    this.successAudio.currentTime = 0;
    this.successAudio.play().catch((error) => {
      console.error('成功声音播放失败:', error);
    });
  }
}

export const audioPlayer = new AudioPlayer();
