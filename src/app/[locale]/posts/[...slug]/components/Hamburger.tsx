'use client'
import React, { useState } from 'react'

const Hamburger = () => {
    const [open, setOpen] = useState(false);
    return (
			<button
				title="Menu"
				type="button"
				className="focus:outline-none h-10 w-fit p-1"
				onClick={() => setOpen(!open)}>
				<div
					data-menu-open={open}
					className="menu-toggle before:bg-black after:bg-black dark:before:bg-white dark:after:bg-white"></div>
			</button>
		);
}

export default Hamburger