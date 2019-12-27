const { Canvas } = require(`canvas-constructor`) 
const sizeOf = require(`buffer-image-size`)
const { DEFAULT, DATABAR, CONTENT } = require(`./Configurations`)
const palette = require(`../colorset`)
const themePresets = require(`./Themes`)
const { resolve, join } = require(`path`)

Canvas.registerFont(resolve(join(__dirname, `../../fonts/OpenSans-Light.ttf`)), `OpenSansLight`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/OpenSans-Regular.ttf`)), `OpenSansRegular`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/OpenSans-SemiBold.ttf`)), `OpenSansSemiBold`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/OpenSans-Bold.ttf`)), `OpenSansBold`)
Canvas.registerFont(resolve(join(__dirname, `../../fonts/OpenSans-ExtraBold.ttf`)), `OpenSansExtraBold`)



/**
 * Universal UI Library for Annie's Material Design.
 * Supports method chaining.
 */
class Card {


	/**
	 * Global presets for current card instance.
	 * @param {*} Object
	 */
	constructor({
		width=DEFAULT.WIDTH, 
		height=DEFAULT.HEIGHT, 
		theme=DEFAULT.THEME, 
		dataBarSize=DEFAULT.DATABAR.SIZE,
		primaryColor=themePresets[DEFAULT.THEME].text,
		marginLeft=50,
		marginTop=20
	
		}) {
		this.width = width
		this.height = height
		this.parsingThemeCode = theme.startsWith(`dark`) ? `dark` : `light`
		this.color = themePresets[this.parsingThemeCode]
		this.canv = new Canvas(this.width, this.height) 
		this.marginLeft = marginLeft
		this.marginTop = marginTop
		this.dataBarCount = 0
		this.dataBarSize = dataBarSize
		this.reservedSpace = 0
		this.primaryColor = primaryColor
	}


	/**
	 * 	Finisher method chain..
	 * 	@ready
	 */
	ready() {
		return this.canv
	}
	

	/**
	 * 	Fallback handler for component's color property.
	 * 	@param {String} prop color's name reference.
	 *	@param {String} defaultOpt fallback color when given prop is not exists in the available palette pool.
	 * 	@private	
	 * 	@_resolveColor
	 */
	_resolveColor(prop, defaultOpt) {
		//	Check for color availability in standard colorset
		if (palette[prop]) return palette[prop]

		//	If color is inherited, this will use the defined primary color in the global preset.
		if ((prop === `inherit`) && palette[this.primaryColor]) return palette[this.primaryColor] 
		if ((prop === `inherit`) && this.color[this.primaryColor]) return this.color[this.primaryColor] 
		if (prop === `inherit`) return this.primaryColor
		//	Following system theming
		if (this.color[prop]) return this.color[prop]

		return defaultOpt
	}


	/**
	 *  ----------------------------------------------------------------------------------------
	 * 	CARDS COMPONENTS SECTION
	 * ----------------------------------------------------------------------------------------
	 * 
	 */


	/**
	 *	Initialize canvas with base card layer.
	 *	@param {Hex|ResolvableColor} color custom color choice.
	 *	@param {Integer} cornerRadius integer value for card cornerning radius.
	 *	@createBase
	 */
	createBase({color=``, cornerRadius=DEFAULT.CORNER_RADIUS}) {
		this.canv
		.setColor(this._resolveColor(color, this.color.main))
		.createBeveledClip(10, 10, this.width - 20, this.height - 20, cornerRadius)
		.addRect(0, 0, this.width, this.height)

		return this
	}


	/**
	 * 	Creating a FAB-like bar that displays a bit piece of information.
	 * 	@param {*} Object 
	 * 	@createDataBar
	 */
	createDataBar({
		content=``, 
		label=``, 
		size=this.dataBarSize,
		align=`left`,
		contentColor=null,
		barColor=null,
		labelColor=null,
		disableShadow=false,
		inline=false,
		releaseHook=false}) {


		//	Handle sensitive case
		size = size.toUpperCase()
		//	Handle custom color selection
		barColor = this._resolveColor(barColor, this.color.secondary)
		contentColor = this._resolveColor(contentColor, this.color.text)
		labelColor = this._resolveColor(labelColor, this.color.text)

		//	Flexible X positioning
		const leftMarginState = (this.dataBarCount > 0) && inline
		? (DATABAR[size].WIDTH * this.dataBarCount) + (10 * this.dataBarCount) + this.marginLeft
		: this.marginLeft


		this.canv.save()


		//	Apply shadow if the selected theme is allowing object shadow elevation.
		if (!disableShadow && this.color.allowedShadow) {
			this.canv.setShadowColor(contentColor)
			.setShadowOffsetY(10)
			.setShadowBlur(15)
			.setColor(this.color.main)
	
			.addRect(leftMarginState+20, this.reservedSpace+20, DATABAR[size].WIDTH-40, DATABAR[size].HEIGHT-35)
			.setShadowBlur(0)
			.setShadowOffsetY(0)
		}


		//	If custom color is not specified, will follow default theming preset instead.
		this.canv.setColor(barColor)
		.createBeveledClip(leftMarginState, this.reservedSpace, DATABAR[size].WIDTH, DATABAR[size].HEIGHT, DEFAULT.DATABAR.CORNER_RADIUS)
		.addRect(this.marginLeft, this.reservedSpace, this.width, this.height)


		//	Main info
		this._databarTextContent({
			type: `MAIN_TEXT`,
			align: `center`,
			size: `MEDIUM`,
			content: content, 
			marginLeft: leftMarginState+(DATABAR[size].WIDTH/2), 
			marginTop: this.reservedSpace+(DATABAR[size].HEIGHT/1.4),
			color: contentColor,
		})


		//	Label info
		this._databarTextContent({
			type: `LABEL`,
			align: align,
			size: `SMALL`,
			content: label, 
			marginLeft: leftMarginState+(DATABAR[size].WIDTH/4.2), 
			marginTop: this.reservedSpace+(DATABAR[size].HEIGHT/3.9),
			color: labelColor
			
		})


		this.canv.restore()

		//	Add state for flexible X positioning
		this.dataBarCount += 1
		//	Add state for flexible Y positioning
		if (!inline || (inline && releaseHook)) this.reservedSpace += DATABAR[size].HEIGHT

		return this
	}


	/**
	 *	Create content separator. Vertically.
	 *	@param {*} Object
	 *	@createVerticalSeparator
	 */
	createVerticalSeparator({margin=20, thickness=1}) {
		this.canv
		.setColor(this.color.separator)
		.addRect(0, this.reservedSpace + margin, this.width, thickness)

		this.reservedSpace += (margin*2)

		return this
	}


	/**
	 *  ----------------------------------------------------------------------------------------
	 * 	TYPOGRAPHY COMPONENTS SECTION
	 * ----------------------------------------------------------------------------------------
	 * 
	 */


	/**
	 * 	Content-fill for Data Bar
	 * 	@private
	 * 	@param {*} Object
	 * 	@_databarTextContent
	 */
	_databarTextContent({
		content=``, 
		marginTop=this.marginTop, 
		marginLeft=this.marginLeft, 
		size=`MEDIUM`, 
		align=`center`, 
		color=this.color.text,
		type=`MAIN_TEXT`
		}) {

		this.canv
		.setTextAlign(align)
		.setColor(color)
		.setTextFont(CONTENT[type].SIZE[size])
		.addText(content, marginLeft, marginTop)
	}	

	 
	/**
	 * 	Return fixed position for custom horizontal align
	 * 	@param {String} alignName
	 * 	@_getHorizontalAlign
	 */
	_getHorizontalAlign(alignName=`left`) {
		const alignPresets = {
			left: this.marginLeft,
			center: this.width/2,
			right: this.width - this.marginLeft
		}

		return alignPresets[alignName]
	}


	/**
	 * 	Add title section to the card.
	 * 	@param {*} Object 
	 * 	@addTitle
	 */
	addTitle({
		main=``,
		caption=null, 
		align=`left`,
		inline=false,
		marginTop=DEFAULT.HEADER.TITLE.HEIGHT,
		fontWeight=null,
		marginLeft=0,
		captionMargin=25}) {

		this.canv
		.setColor(this.color.text)
		.setTextAlign(align)
		.setTextFont(fontWeight ? `${parseInt(DEFAULT.HEADER.TITLE.FONT)}pt OpenSans${fontWeight}` : DEFAULT.HEADER.TITLE.FONT)
		.addText(main, marginLeft + this._getHorizontalAlign(align), marginTop)

		if (caption) {
			this.canv
			.setTextFont(DEFAULT.HEADER.CAPTION.FONT)
			.setColor(this.color.caption)
			.addText(caption, marginLeft + this._getHorizontalAlign(align), marginTop + captionMargin)
		}

		//	Add state for flexible Y positioning
		if (!inline) {
			caption ? this.reservedSpace += this.reservedSpace+marginTop+captionMargin : this.reservedSpace += marginTop
		}

		return this
	}


	/**
	 *	Add content/body section to the card.
	 *	@param {*} Object 
	 * 	@addContent
	 */
	addContent({
		main=``,
		caption=null,
		align=`left`,
		mainColor=this.color.okay,
		captionColor=this.color.okay,
		fontWeight=`Bold`,
		size=`small`,
		justify=null,
		marginTop=this.marginTop,
		marginLeft=this.marginLeft,
		marginBottom=0,
		inline=false,
		releaseHook=false,
		captionMargin=20,
		img=null
		}) {

		//	Handle sensitive case
		if (size === `string`) size = size.toUpperCase()
		//	Handle custom color selection
		mainColor = this._resolveColor(mainColor, this.color.text)
		captionColor = this._resolveColor(captionColor, this.color.caption)


		if (main) {
			this.canv
			.setColor(mainColor)
			.setTextAlign(align)
			.setTextFont(typeof size === `string` ? CONTENT.MAIN_TEXT.SIZE[size] : `${size}pt OpenSans${fontWeight}`)
			.addText(main, justify ? this._getHorizontalAlign(justify) : inline ? marginLeft + 30 : marginLeft, this.reservedSpace+marginTop)
		}


		if (caption) {
			this.canv
			.setTextFont(CONTENT.CAPTION.SIZE.LARGE)
			.setColor(captionColor)
			.addText(caption, marginLeft, this.reservedSpace+marginTop+captionMargin)
		}


		if (img) {
			this.canv
			.addImage(img, marginLeft, this.reservedSpace+marginTop-marginBottom)
		}


		//	Add state for flexible Y positioning
		if (!inline || (inline && releaseHook)) {
			if (caption) this.reservedSpace += captionMargin 
			if (img) this.reservedSpace += sizeOf(img).height
			this.reservedSpace += marginTop
		}

		return this
	}
}

module.exports = Card