import Foundation
import Capacitor

CAP_PLUGIN(NativeAudioPlugin, "NativeAudio",
           CAP_PLUGIN_METHOD(load, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(play, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(pause, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(resume, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(stop, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(seek, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(next, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(previous, CAPPluginReturnPromise);
           CAP_PLUGIN_METHOD(destroy, CAPPluginReturnPromise);
)
