mapping = {
61: 'masala_dosa.jpg',
62: 'plain_dosa.jpg',
63: 'idli_sambar.jpg',
64: 'medu_vada.jpg',
65: 'set_dosa.jpg',
66: 'uttapam.jpg',
67: 'veg_hakka_noodles.jpg',
68: 'schezwan_fried_rice.jpg',
69: 'veg_manchurian.jpg',
70: 'chilli_paneer.jpg',
71: 'chicken_fried_rice.jpg',
72: 'classic_veg_burger.jpg',
73: 'paneer_burger.jpg',
74: 'crispy_chicken_burger.jpg',
75: 'cheese_burger.jpg',
77: 'masala_dosa_dosa.jpg',
78: 'mysore_masala_dosa.jpg',
79: 'ghee_roast_dosa.jpg',
80: 'onion_dosa.jpg',
81: 'plain_idli.jpg',
82: 'thatte_idli.jpg',
83: 'rava_idli.jpg',
84: 'idli_vada_combo.jpg',
85: 'garden_fresh_salad.jpg',
86: 'greek_salad.jpg',
87: 'sprouts_salad.jpg',
88: 'fresh_vegetable_salad.jpg',
89: 'white_sauce_pasta.jpg',
90: 'red_sauce_pasta.jpg',
91: 'pink_sauce_pasta.jpg',
92: 'alfredo_pasta.jpg',
93: 'vanilla_ice_cream.jpg',
94: 'chocolate_ice_cream.jpg',
95: 'butterscotch_ice_cream.jpg',
96: 'mango_ice_cream.jpg',
97: 'margherita_pizza.jpg',
98: 'farmhouse_pizza.jpg',
99: 'paneer_tikka_pizza.jpg',
100: 'veggie_delight_pizza.jpg',
}
import django, os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()
from menu.models import MenuItem
for pk, fn in mapping.items():
    item = MenuItem.objects.get(pk=pk)
    item.image_url = '/src/assets/images/' + fn
    item.save(update_fields=['image_url'])
    print('updated', pk, item.name, item.image_url, flush=True)
