
import json
import sys

def inspect_data(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            content = f.read()
            # data.js might start with 'variable =' or just be JSON. 
            # The file viewed started with {"project": ...
            
            try:
                data = json.loads(content)
            except json.JSONDecodeError as e:
                print(f"JSON Error: {e}")
                # Try to clean up if it's strict JS (though previous view looked like valid JSON)
                return

            project = data.get('project')
            if not project:
                print("No 'project' key found.")
                return

            # project structure seems to be:
            # [Name, ?, [Plugins], [Families?], [ObjectTypes], ...]
            # Let's inspect the arrays to find ObjectTypes.
            # Based on previous view, it looked like index 4 was ObjectTypes?
            # 0: null or Name
            # 2: Plugins?
            # 3: ObjectTypes? (The one with "t0", "t1"...)
            
            # Let's print the types if we can find them
            # They usually have a structure like ["items", ...]
            
            if len(project) > 4:
                # print(f"Index 3: {project[3][:2]}") # Debug
                # print(f"Index 4: {project[4][:2]}") # Debug
                
                # It seems index 3 is object types in C2 json export usually?
                # Let's check which one is a list of lists where valid items are.
                
                types_list = project[3] 
                # Check if it's the types list (should contain 'items', 't0' etc)
                
                print("--- Object Types (Name -> Images) ---")
                for item in types_list:
                    if isinstance(item, list) and len(item) > 0:
                        name = item[0]
                        # Recursively find images strings
                        images = set()
                        def find_images(obj):
                            if isinstance(obj, list):
                                for x in obj:
                                    find_images(x)
                            elif isinstance(obj, str):
                                if "images/" in obj:
                                    # Extract just the filename for brevity
                                    img_name = obj.split('/')[-1]
                                    images.add(img_name)
                        
                        find_images(item)
                        if images:
                            images_list = list(images)
                            # interesting_keywords = ['rifle', 'gun', 'pistol', 'ammo', 'food', 'drink', 'water', 'backpack', 'helmet', 'vest', 'pants', 'jacket', 'keycard', 'grenade']
                            # Filter based on image names
                            is_interesting = False
                            for img in images_list:
                                if any(x in img.lower() for x in ['shovel', 'jacket', 'pants', 'sprite', 'soda', 'backpack', 'bag', 'cola', 'pepsi']):
                                    is_interesting = True
                                    break
                            
                            if is_interesting:
                                print(f"Object: {name} => {images_list[:5]}...")

    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    inspect_data(sys.argv[1])
