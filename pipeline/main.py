import os
import facecropper
import json

img_suffixes = ('.jpg', '.jpeg', '.gif', '.png')

dirs = [f for f in os.listdir("./res") if os.path.isdir("./res/" + f)]
print(dirs)

people = []
for d in dirs:

    # Read meta file from dir
    meta = json.load(open("./res/" + d + "/meta.json"))
    p = {'id': d, 'displayname': meta['firstname'], 'images': []}
    people.append(p)

    files = os.listdir("./res/" + d)
    files.sort()
    for f in [f for f in files if f.endswith(img_suffixes)]:
        saved = facecropper.crop_image_to_face("res/" + d + "/" + f, "output")
        p['images'].append(saved)
        print saved

    assert(len(p['images']) == 8)

jsonString = json.dumps(people)
jsonFile = open('output/profiles.json', 'w')
jsonFile.write(jsonString)
jsonFile.close()
