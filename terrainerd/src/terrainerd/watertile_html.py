"""
Poll Google Static Maps API for a series of coordinates and test for presence 
of pixels with water color.  Store matching images in a subdirectory.
"""
import os
import optparse
from html import XHTML
import json
import random


PERCENTAGE_PIXEL_DIFF_ALLOWANCE = 0.5
ABSOLUTE_PIXEL_DIFF_ALLOWANCE = 4


class CommandError(Exception):
    pass


parser = optparse.OptionParser(usage='%prog [options] -j <path to input JSON image data file> -o <output path>')

parser.add_option('-j', '--jsonfile', action="store", 
                  dest="jsonfile",
                  help="Path to a JSON file with image data")

parser.add_option('-o', '--outputfile', action="store", 
                  dest="outputfile", default="index.html",
                  help="Path to an output file. Defaults to index.html")


def sort_images(images):
    """
    return an ordered list of :
    image path, top edge water pixels, bottom edge water pixels, 
    horizontal pixel offset from previous image...
    TODO: will need to adjust this for three-d perspective, since
    top edge will be compressed horizontally
    """

    # images will all have water pixels at top
    # they will also have water pixels at left, right, or bottom
    # sorting algorithm: 
    # first shuffle the list
    # start with item 0
    # compare next: is there an overlap in pixels from bottom of a to 
    # top of B, and ?  is the difference from bottom water pixels 
    # and top water pixels fewer than allowed % and px of bottom number?
    # if so, we have the next in sequence

    random.shuffle(images)
    # only use if both top and bottom have water px
    images = filter(lambda img: img['gmap_edge_pixel_matches'].get('top', False) and 
                                img['gmap_edge_pixel_matches'].get('bottom', False), images)
    
    # first pass sort: total of top and bottom water pixels ascending
    images = sorted(images, key=lambda img: len(img['gmap_edge_pixel_matches']['top']) + \
                                            len(img['gmap_edge_pixel_matches']['bottom']))

    # pass through and find any disallowed bottom/top matches and shift them further down
    # in the list until an allowed position is found
    # if not possible, discard
    num_processed = 0

    print "We have {} images to order".format(len(images))
    for i, img in enumerate(images):
        print "processing image inital # {}".format(i)
        if i == len(images)-1:
            break
        next_img = images[i+1]
        this_bottoms = float(len(img['gmap_edge_pixel_matches']['bottom']))
        next_tops = float(len(next_img['gmap_edge_pixel_matches']['top']))
        initial_img_index = i
        advance_by = 1
        
        while abs(this_bottoms - next_tops) > ABSOLUTE_PIXEL_DIFF_ALLOWANCE or \
              abs(this_bottoms/next_tops - 1) > PERCENTAGE_PIXEL_DIFF_ALLOWANCE:
            # pop this list item and keep trying 
            images.remove(img)
            j = i+advance_by < len(images) and i+advance_by or 0
            if j == 0:
                advance_by = 1 - initial_img_index

            if j == initial_img_index:
                # we have shuffled it all the way back to its initial index
                # without finding a spot, so there isn't one to be found
                print "\n\n:( No happy home found for img :( {}".format(img)
                break
            images.insert(j, img)
            print "inserted image {} at new position {}".format(i, j)
            next_img = images[j+1]
            this_bottoms = float(len(img['gmap_edge_pixel_matches']['bottom']))
            next_tops = float(len(next_img['gmap_edge_pixel_matches']['top']))
            advance_by += 1

        print "Found a happy home for {}".format(img)
        num_processed += 1
        if num_processed == len(images):
            break

    
    return images

def px_offset_images(images):
    """
    add to each member a value of the horizontal pixel offset
    to align bottom of previous with top of current
    """
    for i, img in enumerate(images):
        try:
            next_img = images[i+1]
        except IndexError:
            break
        if i == 0:
            img['horiz_px_shift'] = 0
        next_tops = next_img['gmap_edge_pixel_matches']['top']
        next_top_mid = (next_tops[-1][0] + next_tops[0][0]) / 2
        this_bottoms = img['gmap_edge_pixel_matches']['bottom']
        this_bottom_mid = (this_bottoms[-1][0] + this_bottoms[0][0]) / 2
        horiz_shift_next = this_bottom_mid - next_top_mid
        next_img['horiz_px_shift'] = horiz_shift_next + img['horiz_px_shift']

    return images


def write_html(options):
    """
    read JSON file of images.  
    """
    # read the input folder
    h = XHTML()
    head = h.head()
    head.link(rel="stylesheet", href="style.css")
    body = h.body()
    outerdiv = body.div(style="margin:auto")
    with open(options.jsonfile) as infile:
        imgs = sort_images(json.load(infile))

    # add horizontal pixel offset info
    imgs = px_offset_images(imgs)
    
    for img in imgs:
        h_shift = img['horiz_px_shift']
        ic = outerdiv.div(klass="imgcontainer", 
                          style="position:relative;left:{}px".format(h_shift))
        imgsrc = img['gmapstatic'] 
        ic.img(src=imgsrc)
    with open(options.outputfile, 'w') as f:
        f.write(str(h))


if __name__ == '__main__':
    options, args =  parser.parse_args()
    if not options.outputfile:
        raise CommandError("Error: Specify an outfile.\n\nUsage:{}".format(parser.usage))
    if not options.jsonfile:
        raise CommandError("Error: Specify the json file with image data.\n\nUsage:{}".format(parser.usage))    

    write_html(options)
