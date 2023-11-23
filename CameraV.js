/* eslint-disable prettier/prettier */
import React, {useEffect, useState, useRef} from 'react';
import {View, StyleSheet, TouchableOpacity, Text, Platform} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useCameraFormat,
} from 'react-native-vision-camera';
import {PERMISSIONS, request} from 'react-native-permissions';
import Video from 'react-native-video';
async function requestPermissions() {
  try {
    if (Platform.OS === 'android') {
      const cameraPermission = await request(PERMISSIONS.ANDROID.CAMERA);
      const microphonePermission = await request(
        PERMISSIONS.ANDROID.RECORD_AUDIO,
      );
      const readPermission = await request(
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
      );
      const writePermission = await request(
        PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
      );

      if (
        cameraPermission === 'granted' &&
        microphonePermission === 'granted' &&
        readPermission === 'granted' &&
        writePermission === 'granted'
      ) {
        console.log('All permissions granted');
      } else {
        console.log(
          'Permission denied',
          cameraPermission,
          microphonePermission,
          readPermission,
          writePermission,
        );
      }
    } else {
      console.log('iOS permissions already configured');
    }
  } catch (err) {
    console.error('Error requesting permissions:', err);
  }
}

function Cameraa() {
  const camera = useRef(null);
  const devices = useCameraDevices();
  // const backCameras = devices.filter(device => device.position === 'back');
  // const device = backCameras[0];
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [torch,setTorch] = useState('off');
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [isStopButtonDisabled, setIsStopButtonDisabled] = useState(false); // State to disable the stop button initially

  const [showCamera, setShowCamera] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [videoSource, setVideoSource] = useState('');
  const [showRecordedVideo, setShowRecordedVideo] = useState(false);

  useEffect(() => {
    async function setup() {
      await requestPermissions();
      if (devices && devices.length > 0) {
        setSelectedDevice(devices[0]); // Set default camera on load
      }
    }
    setup();
  }, [devices]);
  const format = useCameraFormat(selectedDevice, [
    {videoResolution: {width: 640, height: 480}, pixelFormat: 'native'},
  ]);

  const toggleCameraView = () => {
    setShowCamera(prevState => !prevState);
  };
  const toggletorch = () => {
    if (torch === 'on'){
      setTorch('off');
    }
    else {
      setTorch('on');
    }
    console.log(torch);
  };
  const switchCamera = () => {
    if (devices.length > 1 && selectedDevice) {
      const currentIndex = devices.findIndex(
        device => device.id === selectedDevice.id,
      );
      const nextIndex = (currentIndex + 1) % devices.length;
      setSelectedDevice(devices[nextIndex]);
    }
  };

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        setTimer(0); // Reset timer when starting recording
        const interval = setInterval(() => {
          setTimer(prevTimer => prevTimer + 1); // Increment timer every second
        }, 1000);
        setTimerInterval(interval);

        const recordingTimeout = setTimeout(async () => {
          // If recording exceeds 25 seconds, stop automatically
          clearInterval(interval); // Stop timer interval
          setIsRecording(false);
          setIsStopButtonDisabled(false); // Enable the stop button
          try {
            const video = await camera.current.stopRecording();
            setShowRecordedVideo(true);
            console.log('Recording automatically stopped after 25 seconds:');
          } catch (error) {
            console.error('Error stopping recording:', error);
            setIsRecording(false);
          }
        }, 25000); // 25 seconds timeout

        const video = await camera.current.startRecording({
          video: true,
          audio: true,
          videoBitrate: 'low',
          onRecordingError: error => {
            console.error('Recording error:', error);
            setIsRecording(false);
            clearTimeout(recordingTimeout); // Clear the automatic stop timeout on error
          },
          onRecordingFinished: video => {
            setIsRecording(false);
            setVideoSource(video.path);
            setShowRecordedVideo(true);
            console.log('Finished recording:', video);
            clearTimeout(recordingTimeout); // Clear the automatic stop timeout on manual stop
          },
        });

        setIsRecording(true);
        setIsStopButtonDisabled(true); // Disable the stop button when recording starts
        console.log('Started recording');

        setTimeout(() => {
          setIsStopButtonDisabled(false);
        }, 10000); // Enable the stop button after 10 seconds
      } catch (error) {
        console.error('Error starting recording:', error);
        setIsRecording(false);
      }
    } else {
      clearInterval(timerInterval); // Stop the timer when recording stops

      try {
        const video = await camera.current.stopRecording();
        setIsRecording(false);
        setShowRecordedVideo(true);
        console.log('Stopped recording');
      } catch (error) {
        console.error('Error stopping recording:', error);
        setIsRecording(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      {showCamera ? (
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={selectedDevice}
          isActive={showCamera}
          video={true}
          format={format}
          enableZoomGesture={true}
          torch={torch}
        />
      ) : (
        <Text></Text>
      )}
      {isRecording && <Text style={styles.timerText}>{formatTime(timer)}</Text>}
      <View style={styles.buttonContainer}>
        {!showCamera ? (
          <TouchableOpacity style={styles.button} onPress={toggleCameraView}>
            <Text style={styles.buttonText}>Open Camera</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <TouchableOpacity
              style={[
                styles.button,
                isRecording && isStopButtonDisabled && {opacity: 0.5},
              ]}
              onPress={toggleRecording}
              disabled={isStopButtonDisabled} // Disable the button based on the state
            >
              <Text style={styles.buttonText}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={switchCamera}>
              <Text style={styles.buttonText}>Switch Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={toggletorch}>
        <Text style={styles.buttonText}>
          {torch === 'on' ? 'Turn Off Torch' : 'Turn On Torch'}
        </Text>
      </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
const formatTime = seconds => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const formattedTime = `${minutes < 10 ? '0' : ''}${minutes}:${
    remainingSeconds < 10 ? '0' : ''
  }${remainingSeconds}`;
  return formattedTime;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
  },
  timerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#77c3ec',
    padding: 10,
    borderRadius: 8,
    margin: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default Cameraa;
