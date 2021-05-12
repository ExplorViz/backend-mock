sed -i "s#landscape-token#$LANDSCAPE_TOKEN#g" inspectit/inspectit.yml

sed -i "s#landscape-secret#$LANDSCAPE_SECRET#g" inspectit/inspectit.yml

sed -i "s#localhost:55678#$OC_COLLECTOR_ADDRESS#g" inspectit/inspectit.yml