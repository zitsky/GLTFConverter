import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { texture3D } from 'three/tsl'
import { JSONLoader } from './jsonLoader.js'
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initViewer, { once: true })
} else {
  initViewer()
}

function initViewer() {
  const app = document.querySelector('#app')
  if (!app) {
    console.error('Не найден контейнер #app')
    return
  }

  app.innerHTML = `
    <div class="viewer-shell">
      <div class="viewport">
        <canvas id="three-view"></canvas>
      </div>
      <div class="toolbar">
        <input type="file" id="model-input" accept=".gltf,.glb,.obj,.json" hidden />
        <label class="upload" for="model-input">
          <span class="upload__title">Загрузить модель</span>
          <span class="upload__subtitle">Поддерживаются .gltf, .glb, .obj, .json</span>
        </label>
        <span class="toolbar__status" id="status-text">Демо-модель загружена</span>
        <div class="toolbar__spacer"></div>
        <button class="action ghost" id="export-gltf">Экспорт GLTF</button>
        <button class="action primary" id="export-glb">Экспорт GLB</button>
    </div>
  </div>
`

  const canvas = document.querySelector('#three-view')
  const statusText = document.querySelector('#status-text')
  const fileInput = document.querySelector('#model-input')
  const exportGltfBtn = document.querySelector('#export-gltf')
  const exportGlbBtn = document.querySelector('#export-glb')
  const viewportElement = app.querySelector('.viewport')
  const SUPPORTED_FORMATS = ['gltf', 'glb', 'obj', 'json']

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setAnimationLoop(animate)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#05060b')

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000)
  camera.position.set(6, 4, 8)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.target.set(0, 0.8, 0)

  const hemi = new THREE.HemisphereLight(0xddefff, 0x080820, 1.2)
  scene.add(hemi)

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4)
  keyLight.position.set(4, 8, 6)
  scene.add(keyLight)

  const fillLight = new THREE.DirectionalLight(0xffcfa3, 0.8)
  fillLight.position.set(-8, 4, -5)
  scene.add(fillLight)

  const grid = new THREE.GridHelper(40, 40, 0x1e2434, 0x1e2434)
  grid.position.y = -1.2
  scene.add(grid)

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(8, 64),
    new THREE.MeshStandardMaterial({ color: 0x0b0f18, roughness: 0.9, metalness: 0 })
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -1.21
  scene.add(floor)

  const contentRoot = new THREE.Group()
  scene.add(contentRoot)

  const gltfLoader = new GLTFLoader()
  const objLoader = new OBJLoader()
  const objectLoader = new THREE.ObjectLoader()
  const bufferGeometryLoader = new THREE.BufferGeometryLoader()
  const exporter = new GLTFExporter()

  let activeObject = null

  initDemoModel()
  resizeRenderer(window.innerWidth, window.innerHeight)
  window.addEventListener('resize', (e) => resizeRenderer(e.target.innerWidth, e.target.innerHeight));
  const viewportResizeObserver =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver((entries) => {
          for (const entry of entries) {
            if (entry.target === viewportElement) {
              const { width, height } = entry.contentRect
              resizeRenderer(width, height)
            }
          }
        })
      : null
  if (viewportResizeObserver && viewportElement) {
    viewportResizeObserver.observe(viewportElement)
  }
  fileInput?.addEventListener('change', handleFileSelect)
  exportGltfBtn?.addEventListener('click', () => exportCurrent(false))
  exportGlbBtn?.addEventListener('click', () => exportCurrent(true))

  function initDemoModel() {
    const demo = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.9, 0.32, 220, 32),
      new THREE.MeshStandardMaterial({
        color: 0x5ec1ff,
        metalness: 0.5,
        roughness: 0.2,
        emissive: 0x011627
      })
    )
    demo.castShadow = true
    demo.receiveShadow = true
    demo.rotation.x = Math.PI * 0.17

    setActiveObject(demo)
    setStatus('Демо-модель загружена')
  }

  function setActiveObject(object3D) {
    clearContent(contentRoot)
    contentRoot.add(object3D)
    activeObject = object3D
    focusCameraOn(object3D)
  }

  function clearContent(group) {
    group.children.forEach((child) => {
      child.traverse((node) => {
        if (node.isMesh || node.isLine || node.isPoints) {
          node.geometry?.dispose?.()
          disposeMaterial(node.material)
        }
      })
    })
    group.clear()
  }

  function disposeMaterial(material) {
    if (!material) return
    if (Array.isArray(material)) {
      material.forEach((mat) => mat?.dispose?.())
      return
    }
    material.dispose?.()
  }

  function resizeRenderer(nextWidth, nextHeight) {
    console.log('resizeRenderer', nextWidth, nextHeight)
    const container = viewportElement || canvas.parentElement || canvas
    const width = nextWidth ?? container?.clientWidth ?? container?.getBoundingClientRect?.().width ?? 0
    const height =
      nextHeight ?? container?.clientHeight ?? container?.getBoundingClientRect?.().height ?? 0

    if (!width || !height) return

    renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  function animate() {
    controls.update()
    renderer.render(scene, camera)
  }

  function handleFileSelect(event) {
    const file = event.target.files?.[0]
    if (!file) return

    const extension = getExtension(file.name)
    if (!SUPPORTED_FORMATS.includes(extension)) {
      setStatus('Поддерживаются форматы: .gltf, .glb, .obj, .json')
      fileInput.value = ''
      return
    }

    const reader = new FileReader()
    const shouldReadAsBinary = extension === 'glb'

    setStatus('Идёт загрузка модели…')

    reader.onload = async () => {
      try {
        const object3D = await parseModelByExtension(extension, reader.result)
        setActiveObject(object3D)
        setStatus(`Модель «${file.name}» загружена`)
      } catch (error) {
        console.error(error)
        setStatus(error?.message || 'Ошибка во время импорта модели')
      } finally {
        fileInput.value = ''
      }
    }

    reader.onerror = () => {
      console.error(reader.error)
      setStatus('Не удалось прочитать файл')
      fileInput.value = ''
    }

    if (shouldReadAsBinary) {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file)
    }
  }

  function exportCurrent(binary) {
    if (!activeObject) {
      setStatus('Нет модели для экспорта')
      return
    }

    setStatus('Экспортируем…')

    exporter.parse(
      activeObject,
      (result) => {
        if (binary) {
          downloadBlob(result, 'scene.glb', 'model/gltf-binary')
          setStatus('GLB сохранён')
        } else {
          const json = JSON.stringify(result, null, 2)
          downloadBlob(json, 'scene.gltf', 'model/gltf+json')
          setStatus('GLTF сохранён')
        }
      },
      (error) => {
        console.error(error)
        setStatus('Ошибка во время экспорта')
      },
      { binary }
    )
  }

  async function parseModelByExtension(extension, payload) {
    switch (extension) {
      case 'glb':
      case 'gltf':
        return parseGltfPayload(payload)
      case 'obj':
        return parseObjPayload(payload)
      case 'json':
        return parseJsonPayload(payload)
      default:
        throw new Error('Формат файла не поддерживается')
    }
  }

  function parseGltfPayload(payload) {
    return new Promise((resolve, reject) => {
      gltfLoader.parse(
        payload,
        '',
        (gltf) => {
          const model = gltf.scene || gltf.scenes?.[0]
          if (model) {
            resolve(model)
            return
          }
          reject(new Error('GLTF не содержит сцену'))
        },
        (error) => reject(error)
      )
    })
  }

  function parseObjPayload(payload) {
    const text = ensureTextData(payload)
    const model = objLoader.parse(text)
    ensureFallbackMaterials(model)
    return model
  }

  function isBitSet(value, position ) {

    if ((value & ( 1 << position )) == 0) {
      return false;
    }
    return true;
  }

  function parseJsonPayload(payload) {
    
    const json = ensureJson(payload)
    console.log('parseJsonPayload', json);

    if(json.metadata?.formatVersion < 4) {
      const jsloader = new JSONLoader();
      return jsloader.parse(json);
    }

//     const type = json.metadata?.type?.toLowerCase();
//     const geometry = new THREE.BufferGeometry();

//     const facesSource = json.faces;

//     const realFaces = [];

//     for (let i = 0; i < facesSource.length;) {
//       const value = facesSource[i];

//       const isQuad = isBitSet(type, 0);
//       const faceMaterial = isBitSet(type, 1);
//       const faceUv = isBitSet(type, 2);//(1 index) 2
//       const faceMaterial = isBitSet(type, 1);//face vertex uvs (3 indices or 4 indices)
//       const faceMaterial = isBitSet(type, 1);//face normal (1 index)
//       const faceMaterial = isBitSet(type, 1);//face vertex normals (3 indices or 4 indices)
//       const faceMaterial = isBitSet(type, 1);//face color (1 index)
//       const faceMaterial = isBitSet(type, 1);// face vertex colors (3

//       2: 0 = no face uvs, 1 = face uvs (1 index)
//       3: 0 = no face vertex uvs, 1 = face vertex uvs (3 indices or 4 indices)
//       4: 0 = no face normal, 1 = face normal (1 index)
//       5: 0 = no face vertex normals, 1 = face vertex normals (3 indices or 4 indices)
//       6: 0 = no face color, 1 = face color (1 index)
//       7: 0 = no face vertex colors, 1 = face vertex colors (3
      
//       if(isQuad) {
//         realFaces.push(facesSource[i+1], facesSource[i+2], facesSource[i+3]);
//         realFaces.push(facesSource[i+1], facesSource[i+3], facesSource[i+4]);
//         i+=5;
//       }else{
//         realFaces.push(facesSource[i+1], facesSource[i+2], facesSource[i+3]);
//         i+=4;
//       }
      
//     }


// geometry.setAttribute('position',
//     new THREE.Float32BufferAttribute(Float32Array.from(json.vertices), 3, true));
// geometry.setAttribute('uv',
//     new THREE.Float32BufferAttribute(Float32Array.from(json.uvs[0]), 2, true));
//     geometry.setAttribute('index',
//       new THREE.Int16BufferAttribute(Int16Array.from(realFaces), 3, true));
// geometry.computeBoundingBox();
// const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xFFFFFF, metalness: 0.1, roughness: 0.8 }));
// return mesh;

    // if (type === 'buffergeometry') {
    //   const geometry = bufferGeometryLoader.parse(json)
    //   return new THREE.Mesh(
    //     geometry,
    //     new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.8 })
    //   )
    // }

    

    // const modelObject ={
    //   "metadata": {
    //     "version": 4.3,
    //     "type": "Object",
    //     "generator": "ObjectExporter"
    //   },
    //   "geometries": [
    //     {
    //       "uuid": "C3BF1E70-0BE7-4E6D-B184-C9F1E84A3423",
    //       "type": "BufferGeometry",
    //       "data": {
    //         "attributes": {
    //           "position": {
    //             "itemSize": 3,
    //             "type": "Float32Array",
    //             "normalized": false,
    //             "array": json.vertices
    //           },
    //           // "normal": {
    //           //   "itemSize": 3,
    //           //   "type": "Float32Array",
    //           //   "array": json.normals
    //           // },
    //           "uv": {
    //             "itemSize": 2,
    //             "type": "Float32Array",
    //             "array": json.uvs[0]
    //           }
    //         },
    //         "index": {
    //           "type": "Uint16Array",
    //           "array": json.faces
    //         },
    //         "boundingSphere": {
    //           "center": [0,0,0],
    //           "radius": 86.60254037844386
    //         }
    //       }
    //     }
    //   ],
    //   "materials": [
    //     {
    //       "uuid": "87D95D6C-6BB4-4B8F-8166-A3A6945BA5E3",
    //       "type": "MeshPhongMaterial",
    //       "color": 16777215,
    //       "ambient": 16777215,
    //       "emissive": 0,
    //       "specular": 1118481,
    //       "shininess": 30,
    //       "opacity": 1,
    //       "transparent": false,
    //       "wireframe": false
    //     }
    //   ],
    //   "object": {
    //     "uuid": "89529CC6-CBAC-412F-AFD1-FEEAE785BA19",
    //     "type": "Scene",
    //     "matrix": [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],
    //     "children": [
    //       {
    //         "uuid": "33FA38D9-0AAC-4657-9BBE-5E5780DDFB2F",
    //         "name": "Box 1",
    //         "type": "Mesh",
    //         "geometry": "C3BF1E70-0BE7-4E6D-B184-C9F1E84A3423",
    //         "material": "87D95D6C-6BB4-4B8F-8166-A3A6945BA5E3",
    //         "matrix": [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]
    //       }
    //     ]
    //   }
    // }

    // console.log('modelObject', modelObject);

    return objectLoader.parse(json);
  }

  function ensureTextData(payload) {
    if (typeof payload === 'string') return payload
    if (payload instanceof ArrayBuffer) {
      return new TextDecoder().decode(payload)
    }
    throw new Error('Неверный формат файла')
  }

  function ensureJson(payload) {
    try {
      return JSON.parse(ensureTextData(payload))
    } catch (error) {
      console.error(error)
      throw new Error('Не удалось распарсить JSON')
    }
  }

  function ensureFallbackMaterials(object3D) {
    object3D.traverse((node) => {
      if (node.isMesh && !node.material) {
        node.material = new THREE.MeshStandardMaterial({
          color: 0xdadada,
          metalness: 0.05,
          roughness: 0.85
        })
      }
    })
  }

  function getExtension(filename) {
    if (!filename.includes('.')) return ''
    return filename.split('.').pop().toLowerCase()
  }

  function downloadBlob(data, filename, mimeType) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function focusCameraOn(object3D) {
    const box = new THREE.Box3().setFromObject(object3D)
    if (box.isEmpty()) return

    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const fitDistance = maxDim / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2))
    const direction = new THREE.Vector3().subVectors(camera.position, controls.target)
    if (direction.lengthSq() === 0) direction.set(0, 0, 1)
    direction.normalize()

    camera.position.copy(direction.multiplyScalar(fitDistance * 1.5).add(center))
    controls.target.copy(center)
    controls.update()
  }

  function setStatus(message) {
    if (statusText) {
      statusText.textContent = message
    }
  }
}
