from setuptools import setup, find_packages

package_data = {
    'planning': [
        'templates/*.txt',
        'templates/*.html'
    ]
}

setup(
    name="superdesk-planning",
    version="1.6.2",
    package_dir={'': 'server'},
    packages=find_packages('server'),
    package_data=package_data,
    include_package_data=True,
    author='Edouard Richard',
    author_email='edouard.richard@sourcefabric.org',
    license='MIT',
    install_requires=[
        'icalendar==3.11.1',
        'deepdiff==3.3.0'
    ],
    url='',
)
