from PIL import Image, ImageDraw, ImageOps, ImageEnhance
import face_recognition
import os

def crop_image_to_face(filename, output_dir):

    # Load the jpg file into a numpy array
    image = face_recognition.load_image_file(filename)

    # Find all facial features in all the faces in the image
    face_landmarks_list = face_recognition.face_landmarks(image)

    print("I found {} face(s) in {}.".format(len(face_landmarks_list), filename))

    face_landmarks = face_landmarks_list[0]

    # Print the location of each facial feature in this image
    facial_features = [
        'chin',
        'left_eyebrow',
        'right_eyebrow',
        'nose_bridge',
        'nose_tip',
        'left_eye',
        'right_eye',
        'top_lip',
        'bottom_lip'
    ]

    for facial_feature in facial_features:
        print("The {} in this face has the following points: {}".format(facial_feature, face_landmarks[facial_feature]))

    chin = face_landmarks['chin']
    left = 9999
    right = 0
    bottom = 0
    middle = 9999
    for x,y in chin:
        middle = y if x < left else middle # use leftmost as vertical center
        left = x if x < left else left
        right = x if x > right else right
        bottom = y if y > bottom else bottom

    left_eye = face_landmarks['left_eye']
    top = bottom - 1.618*(bottom - left_eye[0][1]) # golden ratio
    print("Left: {} Right: {} Bottom: {} Top: {}".format(left, right, bottom, top))

    # Let's trace out each facial feature in the image with a line!
    pil_image = Image.fromarray(image)

    # Convert to greyscale
    #pil_image = ImageOps.grayscale(pil_image)
    #pil_image = pil_image.convert("L")
    enhancer = ImageEnhance.Color(pil_image)
    pil_image = enhancer.enhance(0.0)

    # Crop
    pil_image = pil_image.crop((left, top, right, bottom))

    bigsize = (pil_image.size[0]*3, pil_image.size[1]*3)
    mask = Image.new('L', bigsize, 0)
    d = ImageDraw.Draw(mask)
    #d.ellipse([left*3, top*3, right*3, bottom*3], fill=255)
    d.ellipse((0,0)+bigsize, fill=255)
    mask = mask.resize(pil_image.size, Image.ANTIALIAS)
    pil_image.putalpha(mask)

    if not os.path.exists(output_dir + "/faces"):
        os.makedirs(output_dir + "/faces")

    basename = os.path.basename(filename)
    savename = "faces/" + basename.split(".")[0] + ".png"
    pil_image.save(output_dir + "/" + savename)

    return savename

    #for facial_feature in facial_features:
    #    d.line(face_landmarks[facial_feature], width=5)
    #pil_image.show()
