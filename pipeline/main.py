import os
import facecropper
import json

files = os.listdir("./res")

files = [f for f in files if f.endswith(('.jpg', '.png', '.gif'))]
print(files)

people = [
    {'id': 'patrickstewart', 'name': 'Patrick Stewart'},
    {'id': 'britneyspears', 'name': 'Britney Spears'},
    {'id': 'leehyori', 'name': 'Lee Hyori'},
    ]

for p in people:
    p['images'] = []
    for f in [f for f in files if f.startswith(p['id'])]:
        saved = facecropper.crop_image_to_face("res/" + f, "output")
        p['images'].append(saved)

jsonString = json.dumps(people)
jsonFile = open('output/profiles.json', 'w')
jsonFile.write(jsonString)
jsonFile.close()
