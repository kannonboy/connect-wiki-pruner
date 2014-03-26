descriptorUrl=$1
host=$2

upmToken=`curl -I "$host/rest/plugins/1.0/" -u admin:admin| grep upm-token | awk -F 'upm-token: ' '{print $2}' | sed s/.$//`
curl -X POST -H 'Content-Type: application/vnd.atl.plugins.remote.install+json' -u admin:admin $host/rest/plugins/1.0/?token=$upmToken --data "{\"pluginUri\":\"$descriptorUrl\"}"
