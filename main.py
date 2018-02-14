import os
import facecropper

files = os.listdir("./res")

print(files)

for f in files:
    facecropper.crop_image_to_face("res/" + f)
