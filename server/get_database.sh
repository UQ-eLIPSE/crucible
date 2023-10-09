read -p 'Enter UQ Username ' uservar

USERNAME=$uservar

if [ ! $USERNAME ]
then
    echo "USAGE: $0 mango_username"
    exit 1
fi

rm -rf src/database/data

mkdir src/database/data

# Print out list of available seeds and remove full path and extension so that you're left with file name
FOLDERS=($(ssh $USERNAME@mango.eait.uq.edu.au 'ls -1 /home/groups/elipse-projects/Crucible/data/*.zip | sed s/^.*\\/\//' | sed s/\.[^.]*$//))

echo "Please enter which project seed you want to import: "
select seed in "${FOLDERS[@]}" 
do
    if ($(echo $seed | grep -oP $FOLDERS))
    then 
        echo "Invalid selection"
        continue
    else  
        SEED=${seed}
        break
    fi
done
echo "You selected: $SEED"

if [ ! $SEED ]
then
    echo "USAGE: $SEED sed"
    exit 1e
fi

scp -r $USERNAME@mango.eait.uq.edu.au:/home/groups/elipse-projects/Crucible/data/$SEED.zip src/database/data

cd src/database/data

unzip $SEED.zip

mongorestore $SEED

