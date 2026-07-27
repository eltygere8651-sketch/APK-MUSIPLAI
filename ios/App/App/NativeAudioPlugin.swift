import Foundation
import Capacitor
import AVFoundation
import MediaPlayer

@objc(NativeAudioPlugin)
public class NativeAudioPlugin: CAPPlugin {
    private var player: AVPlayer?
    private var playerItem: AVPlayerItem?
    private var timeObserverToken: Any?
    private var isObserving = false
    
    override public func load() {
        setupAudioSession()
        setupRemoteCommandCenter()
    }
    
    private func setupAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Failed to set audio session category. Error: \(error)")
        }
    }
    
    private func setupRemoteCommandCenter() {
        let commandCenter = MPRemoteCommandCenter.shared()
        
        commandCenter.playCommand.addTarget { [weak self] event in
            self?.player?.play()
            return .success
        }
        
        commandCenter.pauseCommand.addTarget { [weak self] event in
            self?.player?.pause()
            return .success
        }
        
        // Setup next/prev as needed
    }
    
    @objc func load(_ call: CAPPluginCall) {
        guard let urlString = call.getString("url"), let url = URL(string: urlString) else {
            call.reject("Must provide a valid URL")
            return
        }
        
        // Clean up previous
        cleanup()
        
        playerItem = AVPlayerItem(url: url)
        player = AVPlayer(playerItem: playerItem)
        
        // Observe status
        playerItem?.addObserver(self, forKeyPath: "status", options: [.new, .initial], context: nil)
        isObserving = true
        
        // Progress observer
        let interval = CMTime(seconds: 1, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
        timeObserverToken = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            guard let self = self, let player = self.player, let item = player.currentItem else { return }
            
            if item.status == .readyToPlay {
                let position = CMTimeGetSeconds(time) * 1000
                let duration = CMTimeGetSeconds(item.duration) * 1000
                if !duration.isNaN {
                    self.notifyListeners("onProgress", data: [
                        "position": position,
                        "duration": duration
                    ])
                }
            }
        }
        
        updateNowPlaying(title: call.getString("title", default: "Unknown Title"), artist: call.getString("artist", default: "Unknown Artist"))
        call.resolve()
    }
    
    @objc func play(_ call: CAPPluginCall) {
        player?.play()
        notifyListeners("onStateChanged", data: ["status": "PLAYING"])
        call.resolve()
    }
    
    @objc func pause(_ call: CAPPluginCall) {
        player?.pause()
        notifyListeners("onStateChanged", data: ["status": "PAUSED"])
        call.resolve()
    }
    
    @objc func resume(_ call: CAPPluginCall) {
        play(call)
    }
    
    @objc func stop(_ call: CAPPluginCall) {
        player?.pause()
        player?.seek(to: .zero)
        notifyListeners("onStateChanged", data: ["status": "STOPPED"])
        call.resolve()
    }
    
    @objc func seek(_ call: CAPPluginCall) {
        guard let position = call.getDouble("position") else {
            call.reject("Must provide position")
            return
        }
        
        let time = CMTime(seconds: position / 1000.0, preferredTimescale: 1000)
        player?.seek(to: time, toleranceBefore: .zero, toleranceAfter: .zero)
        call.resolve()
    }
    
    @objc func next(_ call: CAPPluginCall) {
        // Not implemented queue yet
        call.resolve()
    }
    
    @objc func previous(_ call: CAPPluginCall) {
        // Not implemented queue yet
        call.resolve()
    }
    
    @objc func destroy(_ call: CAPPluginCall) {
        cleanup()
        call.resolve()
    }
    
    private func cleanup() {
        if let token = timeObserverToken {
            player?.removeTimeObserver(token)
            timeObserverToken = nil
        }
        if isObserving {
            playerItem?.removeObserver(self, forKeyPath: "status")
            isObserving = false
        }
        player?.pause()
        player = nil
        playerItem = nil
    }
    
    override public func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey : Any]?, context: UnsafeMutableRawPointer?) {
        if keyPath == "status", let item = object as? AVPlayerItem {
            if item.status == .readyToPlay {
                notifyListeners("onStateChanged", data: ["status": "READY"])
            } else if item.status == .failed {
                notifyListeners("onStateChanged", data: ["status": "ERROR"])
            }
        }
    }
    
    private func updateNowPlaying(title: String, artist: String) {
        var nowPlayingInfo = [String: Any]()
        nowPlayingInfo[MPMediaItemPropertyTitle] = title
        nowPlayingInfo[MPMediaItemPropertyArtist] = artist
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }
}
