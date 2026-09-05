#!/bin/zsh
set -euo pipefail

source_dir='/Users/minho/Library/Application Support/orca/codex-accounts/51b4d8a0-bc2f-4d3f-9c7e-a512c651ab1c/home/generated_images/01a029c3-ff2d-78b0-898a-ee2a13b6a840'
output_dir='/Users/minho/dev/m1kapp/iljaller-test/public/people'
mkdir -p "$output_dir"

typeset -A portraits=(
  FAB exec-db7c231f-9c91-45f1-ad44-c04fb76113e5.png
  FAL exec-5dd0ec5a-a347-490c-a8df-ff639bec8e2f.png
  FBA exec-c1a171ab-8131-4f1c-9eb5-6ec5328ec30f.png
  FBL exec-10636cf8-8e9c-4a41-941d-052d422dabe7.png
  FLA exec-9ccfd988-34b9-4edd-adf6-6c5f1678ef0a.png
  FLB exec-dde9bb14-26c7-4f0d-9b68-031c73d8ceec.png
  AFB exec-2546a4fd-ed68-455c-a5a2-5399932fdebf.png
  AFL exec-3175a8c1-d2e1-4055-bd89-1dc7afca91d0.png
)

for code file in ${(kv)portraits}; do
  sips -Z 320 -s format jpeg -s formatOptions 84 \
    "$source_dir/$file" --out "$output_dir/$code.jpg" >/dev/null
done

crop_sheet() {
  local sheet="$1"
  shift
  local codes=("$@")
  local index=1
  local row column y x code

  for row in 0 1; do
    for column in 0 1 2 3; do
      code="${codes[$index]}"
      y=$((row * 512))
      x=$((column * 384))
      ffmpeg -loglevel error -y -i "$source_dir/$sheet" \
        -vf "crop=384:512:$x:$y" "$output_dir/$code.png"
      sips -Z 320 -s format jpeg -s formatOptions 84 "$output_dir/$code.png" \
        --out "$output_dir/$code.jpg" >/dev/null
      rm "$output_dir/$code.png"
      index=$((index + 1))
    done
  done
}

crop_sheet exec-c1db967c-5a49-49fc-aa64-6df0e7f8b9e6.png \
  ABF ABL ALF ALB BFA BFL BAF BAL

crop_sheet exec-01458457-b2ec-447e-b381-f771f556972c.png \
  BLF BLA LFA LFB LAF LAB LBF LBA

# BFA uses a single-person Michael Faraday portrait instead of the sheet's duo.
sips -Z 320 -s format jpeg -s formatOptions 84 \
  "$source_dir/exec-fc7bdc5b-a331-4de5-8d5c-650b1bb9207d.png" \
  --out "$output_dir/BFA.jpg" >/dev/null
