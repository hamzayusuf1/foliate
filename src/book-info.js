import Gtk from 'gi://Gtk'
import Adw from 'gi://Adw'
import Pango from 'gi://Pango'
import { gettext as _ } from 'gettext'
import * as utils from './utils.js'
import * as format from './format.js'

const makePropertyBox = (title, value) => {
    const box = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 3,
    })
    box.append(utils.addClass(new Gtk.Label({
        xalign: 0,
        wrap: true,
        label: title,
    }), 'caption-heading'))
    box.append(new Gtk.Label({
        margin_bottom: 6,
        xalign: 0,
        wrap: true,
        selectable: true,
        label: value,
        wrap_mode: Pango.WrapMode.WORD_CHAR,
    }))
    return box
}

const makeSubjectBox = subject => {
    const box = new Gtk.Box({ spacing: 6 })
    box.append(new Gtk.Image({
        icon_name: 'view-tag-symbolic',
        valign: Gtk.Align.START,
    }))
    box.append(utils.addClass(new Gtk.Label({
        xalign: 0,
        wrap: true,
        selectable: true,
        label: typeof subject === 'string'
            ? subject : subject.name ?? subject.code,
        valign: Gtk.Align.START,
    }), 'caption'))
    return box
}

const makeBookInfoBox = (metadata, wide) => {
    const box = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        spacing: 6,
    })

    box.append(utils.addClass(new Gtk.Label({
        xalign: 0,
        wrap: true,
        selectable: true,
        label: metadata.title ?? '',
    }), wide ? 'title-1' : 'title-2'))

    box.append(new Gtk.Label({
        xalign: 0,
        wrap: true,
        selectable: true,
        label: format.list(metadata.author
            ?.map(author => typeof author === 'string' ? author : author.name)),
    }))

    if (metadata.description) box.append(new Gtk.Label({
        xalign: 0,
        wrap: true,
        use_markup: true,
        selectable: true,
        margin_top: 12,
        label: metadata.description,
    }))
    box.append(new Gtk.Box({ vexpand: true }))

    const flowbox = new Gtk.FlowBox({
        selection_mode: Gtk.SelectionMode.NONE,
        row_spacing: 12,
        column_spacing: 18,
        margin_top: 12,
        margin_bottom: 6,
    })
    box.append(flowbox)

    const longIdentifier = metadata.identifier?.length > 18

    for (const [title, value] of [
        [_('Publisher'), metadata.publisher],
        [_('Published'), format.date(metadata.published)],
        [_('Updated'), format.date(metadata.modified)],
        [_('Language'), format.language(metadata.language)],
        [_('Identifier'), longIdentifier ? null : metadata.identifier],
    ].filter(([, value]) => value))
        flowbox.insert(makePropertyBox(title, value), -1)

    if (longIdentifier) box.append(makePropertyBox(_('Identifier'), metadata.identifier))

    if (metadata.subject?.length) {
        const subjectsBox = new Gtk.FlowBox({
            selection_mode: Gtk.SelectionMode.NONE,
            row_spacing: 3,
            column_spacing: 12,
            margin_top: 12,
        })
        box.append(subjectsBox)
        for (const subject of metadata.subject)
            subjectsBox.insert(makeSubjectBox(subject), -1)
    }

    if (metadata.rights) box.append(utils.addClass(new Gtk.Label({
        margin_top: 12,
        xalign: 0,
        wrap: true,
        selectable: true,
        label: metadata.rights,
    }), 'caption', 'dim-label'))
    return box
}

export const makeBookInfoWindow = (root, metadata, pixbuf) => {
    const wide = false//root.default_width > 720

    const win = new Adw.Window({
        title: _('About This Book'),
        default_width: 360,
        default_height: 420,
        modal: true,
        transient_for: root,
        content: new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL }),
    })
    const headerbar = new Gtk.HeaderBar()

    const box = new Gtk.Box()
    const infobox = Object.assign(makeBookInfoBox(metadata, wide), {
        margin_top: 18,
        margin_bottom: 18,
        margin_start: 18,
        margin_end: 18,
    })
    const scrolled = new Gtk.ScrolledWindow({
        hexpand: true,
        vexpand: true,
        width_request: 360,
    })

    if (pixbuf) {
        const picture = new Gtk.Picture({ focusable: true })
        picture.set_pixbuf(pixbuf)
        win.default_height = 700
        const box = new Gtk.Box({
            orientation: Gtk.Orientation.VERTICAL,
        })
        box.append(picture)
        box.append(new Gtk.Separator())
        box.append(infobox)
        scrolled.child = box
        scrolled.child.vscroll_policy = Gtk.ScrollablePolicy.NATURAL
    } else scrolled.child = infobox

    box.append(scrolled)
    win.content.append(headerbar)
    win.content.append(box)
    win.add_controller(utils.addShortcuts({ 'Escape|<ctrl>w': () => win.close() }))
    win.show()
}