import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { CameraView, useCameraPermissions } from "expo-camera";

// ==========================================
// App Principal — GeoPhoto
// ==========================================
export default function App() {
  // ---------- Estados ----------

  // Localização atual do usuário
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  // Controla se a câmera está aberta
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // URI da foto capturada
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  // Coordenadas onde a foto foi tirada (marcador no mapa)
  const [markerLocation, setMarkerLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Controla se a foto está sendo exibida sobre o mapa
  const [showPhoto, setShowPhoto] = useState(false);

  // Permissão da câmera (hook do expo-camera)
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  // Referência para o componente CameraView (para tirar foto)
  const cameraRef = useRef<CameraView>(null);

  // ---------- Efeito: solicitar localização ao abrir o app ----------
  useEffect(() => {
    (async () => {
      // Solicita permissão de localização
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão negada",
          "Precisamos da sua localização para centralizar o mapa."
        );
        return;
      }

      // Obtém a localização atual do usuário
      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  // ---------- Função: abrir a câmera ----------
  const handleOpenCamera = async () => {
    // Solicita permissão da câmera, caso ainda não tenha sido concedida
    if (!cameraPermission?.granted) {
      const permissionResult = await requestCameraPermission();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permissão negada",
          "Precisamos do acesso à câmera para tirar fotos."
        );
        return;
      }
    }

    // Abre a câmera
    setIsCameraOpen(true);
  };

  // ---------- Função: tirar a foto ----------
  const handleTakePicture = async () => {
    if (!cameraRef.current) return;

    try {
      // Captura a foto usando a referência do CameraView
      const photo = await cameraRef.current.takePictureAsync();

      if (!photo) return;

      // Obtém a localização exata no momento da captura
      const currentLocation = await Location.getCurrentPositionAsync({});

      // Salva a URI da imagem no estado
      setPhotoUri(photo.uri);

      // Salva as coordenadas exatas no estado (para o marcador)
      setMarkerLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      // Fecha a câmera e volta para o mapa
      setIsCameraOpen(false);
    } catch (error) {
      console.error("Erro ao tirar foto:", error);
      Alert.alert("Erro", "Não foi possível tirar a foto.");
    }
  };

  // ---------- Função: cancelar a câmera ----------
  const handleCancelCamera = () => {
    setIsCameraOpen(false);
  };

  // ---------- Função: clicar no marcador para mostrar/ocultar a foto ----------
  const handleMarkerPress = () => {
    setShowPhoto(!showPhoto);
  };

  // ---------- Tela de carregamento (enquanto obtém a localização) ----------
  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Obtendo localização...</Text>
      </View>
    );
  }

  // ---------- Tela da Câmera ----------
  if (isCameraOpen) {
    return (
      <View style={styles.cameraContainer}>
        {/* Componente CameraView (expo-camera SDK 50+) */}
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        />

        {/* Botões sobrepostos à câmera */}
        <View style={styles.cameraButtonsContainer}>
          {/* Botão: Tirar Foto */}
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleTakePicture}
          >
            <Text style={styles.cameraButtonText}>Tirar Foto</Text>
          </TouchableOpacity>

          {/* Botão: Cancelar */}
          <TouchableOpacity
            style={[styles.cameraButton, styles.cancelButton]}
            onPress={handleCancelCamera}
          >
            <Text style={styles.cameraButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ---------- Tela Principal: Mapa ----------
  return (
    <View style={styles.container}>
      {/* MapView centralizado na localização do usuário */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }}
        showsUserLocation={true}
      >
        {/* Marker no local onde a foto foi tirada */}
        {markerLocation && (
          <Marker
            coordinate={markerLocation}
            title="Foto tirada aqui"
            onPress={handleMarkerPress}
          />
        )}
      </MapView>

      {/* Botão "Tirar Foto" sobre o mapa */}
      <TouchableOpacity style={styles.takePhotoButton} onPress={handleOpenCamera}>
        <Text style={styles.takePhotoButtonText}>Tirar Foto</Text>
      </TouchableOpacity>

      {/* Exibição da foto ao clicar no marcador */}
      {showPhoto && photoUri && (
        <Image source={{ uri: photoUri }} style={styles.previewContainer} />
      )}
    </View>
  );
}

// ==========================================
// Estilos
// ==========================================
const styles = StyleSheet.create({
  // Container principal
  container: {
    flex: 1,
  },

  // Mapa ocupa a tela inteira
  map: {
    flex: 1,
  },

  // Tela de carregamento
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },

  // Botão "Tirar Foto" sobre o mapa
  takePhotoButton: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },

  takePhotoButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  // Container da câmera (tela inteira)
  cameraContainer: {
    flex: 1,
  },

  // Câmera ocupa a tela inteira
  camera: {
    flex: 1,
  },

  // Botões sobrepostos na parte inferior da câmera
  cameraButtonsContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },

  // Estilo dos botões da câmera
  cameraButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    elevation: 5,
  },

  // Estilo específico do botão Cancelar
  cancelButton: {
    backgroundColor: "#FF3B30",
  },

  // Texto dos botões da câmera
  cameraButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },

  // Estilo obrigatório para a imagem (fornecido pelo professor)
  previewContainer: {
    position: "absolute",
    top: 120,
    right: 20,
    width: 140,
    height: 180,
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    elevation: 10,
  },
});
